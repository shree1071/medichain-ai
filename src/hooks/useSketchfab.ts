import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    Sketchfab: any;
  }
}

export interface SketchfabNode {
  instanceID: number;
  name: string;
  type: string;
  children?: SketchfabNode[];
  materialID?: string;
  [key: string]: any;
}

export function useSketchfab(
  modelUid: string,
  iframeRef: React.RefObject<HTMLIFrameElement | null>
) {
  const [api, setApi] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [nodes, setNodes] = useState<Record<number, SketchfabNode>>({});
  const [error] = useState<string | null>(null);
  const [lastClickedNode, setLastClickedNode] = useState<number | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const originalMaterialsRef = useRef<Record<string, any>>({});
  const isInitializedRef = useRef(false);

  const initViewer = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || typeof window === 'undefined') return;

    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // Safety timer: ensure loading spinner dismisses so iframe is always interactive
    const safetyTimer = setTimeout(() => {
      setIsReady(true);
    }, 4500);

    if (window.Sketchfab) {
      try {
        const client = new window.Sketchfab(iframe);
        client.init(modelUid, {
          success: (sketchfabApi: any) => {
            clearTimeout(safetyTimer);
            setApi(sketchfabApi);
            sketchfabApi.start();
            sketchfabApi.addEventListener('viewerready', () => {
              setIsReady(true);

              sketchfabApi.getAnimations((err: any, animations: any[]) => {
                if (err) console.warn('Animation notice:', err);
                if (animations && animations.length > 0) {
                  sketchfabApi.pause();
                  sketchfabApi.seekTo(0);
                }
              });

              try {
                sketchfabApi.getNodeMap((err: any, nodesMap: Record<number, SketchfabNode>) => {
                  if (!err && nodesMap) {
                    setNodes(nodesMap);
                    console.log(`[Sketchfab] ${Object.keys(nodesMap).length} Sketchfab nodes loaded`);
                  }
                });

                sketchfabApi.getMaterialList((err: any, mats: any[]) => {
                  if (!err && mats) {
                    setMaterials(mats);
                    mats.forEach((m) => {
                      originalMaterialsRef.current[m.id] = JSON.parse(JSON.stringify(m));
                    });
                  }
                });
              } catch (e: any) {
                console.warn('Sketchfab node parsing note:', e);
              }

              sketchfabApi.addEventListener('click', (e: any) => {
                if (e.instanceID) setLastClickedNode(e.instanceID);
              });
            });
          },
          error: () => {
            console.warn('Sketchfab API handshake note - embed player active');
            clearTimeout(safetyTimer);
            const fallbackUrl = `https://sketchfab.com/models/${modelUid}/embed?autostart=1&ui_theme=white&transparent=1&ui_animations=0&ui_infos=0&ui_watermark=0`;
            if (iframe && (!iframe.src || iframe.src === 'about:blank' || iframe.src === window.location.href)) {
              iframe.src = fallbackUrl;
            }
            setIsReady(true);
          },
          autostart: 1,
          ui_theme: 'white',
          transparent: 1,
          ui_animations: 0,
          ui_infos: 0,
          ui_watermark: 0
        });
      } catch (initErr: any) {
        console.warn('Sketchfab client init note:', initErr);
        clearTimeout(safetyTimer);
        const fallbackUrl = `https://sketchfab.com/models/${modelUid}/embed?autostart=1&ui_theme=white&transparent=1&ui_animations=0&ui_infos=0&ui_watermark=0`;
        if (iframe && (!iframe.src || iframe.src === 'about:blank' || iframe.src === window.location.href)) {
          iframe.src = fallbackUrl;
        }
        setIsReady(true);
      }
    } else {
      // Fallback: direct embed URL if Sketchfab JS library not ready
      const embedUrl = `https://sketchfab.com/models/${modelUid}/embed?autostart=1&ui_theme=white&transparent=1&ui_animations=0&ui_infos=0&ui_watermark=0`;
      iframe.src = embedUrl;
    }

    return () => clearTimeout(safetyTimer);
  }, [modelUid, iframeRef]);

  useEffect(() => {
    let checkInterval: any = null;

    if (typeof window !== 'undefined' && window.Sketchfab) {
      initViewer();
      return;
    }

    const script = document.createElement('script');
    script.src = '/sketchfab-viewer-1.12.1.js';
    script.async = true;

    script.onload = () => {
      initViewer();
    };

    script.onerror = () => {
      // Secondary fallback to CDN if local bundle is blocked
      const cdnScript = document.createElement('script');
      cdnScript.src = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';
      cdnScript.async = true;
      cdnScript.onload = () => initViewer();
      document.body.appendChild(cdnScript);
    };

    document.body.appendChild(script);

    // Periodic check until ready
    checkInterval = setInterval(() => {
      if (window.Sketchfab && iframeRef.current && !api) {
        initViewer();
        clearInterval(checkInterval);
      }
    }, 400);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [iframeRef, initViewer, api]);

  // ─── NODE VISIBILITY ─────────────────────────────────────────
  const hideNode = useCallback(
    (nodeId: number) => {
      if (api) api.hide(nodeId);
    },
    [api]
  );

  const showNode = useCallback(
    (nodeId: number) => {
      if (api) api.show(nodeId);
    },
    [api]
  );

  // ─── FIND HELPERS ────────────────────────────────────────────
  const findNodeIdByName = useCallback(
    (name: string): number | null => {
      const lower = name.toLowerCase();
      const exact = Object.values(nodes).find((n) => n?.name?.toLowerCase() === lower);
      if (exact) return exact.instanceID;
      const partial = Object.values(nodes).find(
        (n) => n?.name && n.name.toLowerCase().includes(lower)
      );
      return partial ? partial.instanceID : null;
    },
    [nodes]
  );

  const findAllNodesByPartialName = useCallback(
    (partial: string): SketchfabNode[] => {
      const lower = partial.toLowerCase();
      return Object.values(nodes).filter(
        (n) => n?.name && n.name.toLowerCase().includes(lower)
      );
    },
    [nodes]
  );

  // ─── FORCE HIDE MULTIPLE NODE GROUPS ─────────────────────────
  const forceHideNodeGroups = useCallback(
    (prefixes: string[]) => {
      if (!api) return;
      let count = 0;
      prefixes.forEach((prefix) => {
        const matches = findAllNodesByPartialName(prefix);
        matches.forEach((n) => {
          api.hide(n.instanceID);
          if (n.children) n.children.forEach((c: SketchfabNode) => api.hide(c.instanceID));
          count++;
        });
      });
      console.log(`[Sketchfab] Force-hid ${count} node groups for: ${prefixes.join(', ')}`);
    },
    [api, findAllNodesByPartialName]
  );

  // ─── HIGHLIGHT WITH MAXIMUM GLOW ─────────────────────────────
  const highlightNodeWithColor = useCallback(
    (nodeId: number, color: [number, number, number], emissiveStrength = 2.5) => {
      if (!api || !nodes[nodeId]) return;
      const node = nodes[nodeId];

      // Collect target material IDs and names from this node and all descendants
      const targetMatIds = new Set<string>();
      const targetNames = new Set<string>();

      const collectNodeInfo = (n: SketchfabNode) => {
        if (!n) return;
        if (n.materialID) targetMatIds.add(n.materialID);
        if (Array.isArray(n.materialIDs)) n.materialIDs.forEach((id: string) => targetMatIds.add(id));
        if (n.name) targetNames.add(n.name.toLowerCase().replace(/system|_| |part|mesh/g, ''));
        if (n.children && Array.isArray(n.children)) {
          n.children.forEach(collectNodeInfo);
        }
      };
      collectNodeInfo(node);

      materials.forEach((mat) => {
        const matLower = (mat.name || '').toLowerCase().replace(/system|_| |part|mesh/g, '');
        const isMatch =
          targetMatIds.has(mat.id) ||
          Array.from(targetNames).some(
            (name) => name.length >= 3 && (matLower.includes(name) || name.includes(matLower))
          );

        if (isMatch) {
          const tinted = JSON.parse(JSON.stringify(mat));
          if (!tinted.channels) tinted.channels = {};

          // Guaranteed emissive glow
          tinted.channels.EmitColor = {
            enable: true,
            factor: emissiveStrength,
            color: [...color]
          };

          if (tinted.channels.AlbedoPBR) {
            tinted.channels.AlbedoPBR.enable = true;
            tinted.channels.AlbedoPBR.factor = 1.0;
            tinted.channels.AlbedoPBR.color = [...color];
          }
          if (tinted.channels.DiffuseColor) {
            tinted.channels.DiffuseColor.enable = true;
            tinted.channels.DiffuseColor.factor = 1.0;
            tinted.channels.DiffuseColor.color = [...color];
          }
          if (tinted.channels.Opacity) {
            tinted.channels.Opacity.enable = true;
            tinted.channels.Opacity.factor = 1.0;
          }

          api.setMaterial(tinted, () => {});
        }
      });
    },
    [api, nodes, materials]
  );

  const highlightNode = useCallback(
    (nodeId: number) => {
      highlightNodeWithColor(nodeId, [0.0, 0.85, 1.0], 3.0);
    },
    [highlightNodeWithColor]
  );

  // ─── ROBUST HIGHLIGHT BY ORGAN NAME (NODE + MATERIAL DUAL MATCH) ──
  const highlightOrganByName = useCallback(
    (organKey: string, color: [number, number, number], emissiveStrength = 2.5) => {
      if (!api || materials.length === 0) return;

      const organSynonyms: Record<string, string[]> = {
        heart: ['heart', 'corazon', 'cardio'],
        lungs: ['humanlungs', 'lung', 'lungs', 'pulmo'],
        liver: ['liver', 'hepatic', 'hepato'],
        gut: ['digestivesystem', 'digestive', 'stomach', 'intestine', 'gut', 'pancreas'],
        kidneys: ['urinary_system', 'urinary', 'kidney', 'renal'],
        brain: ['brain', 'cerebr', 'neuro'],
        skin: ['humanskin', 'skin'],
        muscles: ['musclespart', 'muscles', 'muscular'],
        ribcage: ['ribcage', 'ribs']
      };

      const keyLower = organKey.toLowerCase().replace(/system|_| /g, '');
      const syns = organSynonyms[keyLower] || [keyLower];

      // 1. Highlight via matching nodes
      let matchedNodes: SketchfabNode[] = [];
      syns.forEach((syn) => {
        matchedNodes = matchedNodes.concat(findAllNodesByPartialName(syn));
      });
      const directNodeId = findNodeIdByName(organKey);
      if (directNodeId && nodes[directNodeId]) {
        matchedNodes.push(nodes[directNodeId]);
      }

      const processed = new Set<number>();
      matchedNodes.forEach((node) => {
        if (!processed.has(node.instanceID)) {
          processed.add(node.instanceID);
          highlightNodeWithColor(node.instanceID, color, emissiveStrength);
        }
      });

      // 2. Direct material fallback
      materials.forEach((mat) => {
        const matLower = (mat.name || '').toLowerCase().replace(/system|_| |part|mesh/g, '');
        if (syns.some((s) => matLower.includes(s) || s.includes(matLower))) {
          const tinted = JSON.parse(JSON.stringify(mat));
          if (!tinted.channels) tinted.channels = {};

          tinted.channels.EmitColor = {
            enable: true,
            factor: emissiveStrength,
            color: [...color]
          };
          if (tinted.channels.AlbedoPBR) {
            tinted.channels.AlbedoPBR.enable = true;
            tinted.channels.AlbedoPBR.factor = 1.0;
            tinted.channels.AlbedoPBR.color = [...color];
          }
          if (tinted.channels.DiffuseColor) {
            tinted.channels.DiffuseColor.enable = true;
            tinted.channels.DiffuseColor.factor = 1.0;
            tinted.channels.DiffuseColor.color = [...color];
          }
          if (tinted.channels.Opacity) {
            tinted.channels.Opacity.enable = true;
            tinted.channels.Opacity.factor = 1.0;
          }

          api.setMaterial(tinted, () => {});
        }
      });
    },
    [api, materials, nodes, findAllNodesByPartialName, findNodeIdByName, highlightNodeWithColor]
  );

  // ─── MATERIAL TRANSPARENCY ────────────────────────────────────
  const setMaterialTransparency = useCallback(
    (materialName: string, opacity: number) => {
      if (!api || materials.length === 0) return;
      const lower = materialName.toLowerCase().replace(/system|_| |part|mesh/g, '');
      materials.forEach((mat) => {
        const matLower = (mat.name || '').toLowerCase().replace(/system|_| |part|mesh/g, '');
        if (matLower.includes(lower) || lower.includes(matLower)) {
          const t = JSON.parse(JSON.stringify(mat));
          if (!t.channels) t.channels = {};
          if (!t.channels.Opacity) {
            t.channels.Opacity = { enable: true, factor: opacity };
          } else {
            t.channels.Opacity.enable = true;
            t.channels.Opacity.factor = opacity;
          }
          if (t.channels.AlbedoPBR) {
            t.channels.AlbedoPBR.factor = Math.min(t.channels.AlbedoPBR.factor || 1.0, opacity);
          }
          api.setMaterial(t, () => {});
        }
      });
    },
    [api, materials]
  );

  const makeLayersTransparent = useCallback(
    (layerNames: string[], opacity: number) => {
      layerNames.forEach((name) => setMaterialTransparency(name, opacity));
    },
    [setMaterialTransparency]
  );

  // ─── RESET ────────────────────────────────────────────────────
  const resetMaterials = useCallback(() => {
    if (!api) return;
    Object.values(originalMaterialsRef.current).forEach((orig) => {
      api.setMaterial(JSON.parse(JSON.stringify(orig)), () => {});
    });
  }, [api]);

  return {
    api,
    isReady,
    isMaterialsReady: materials.length > 0,
    nodes,
    error,
    materials,
    findNodeIdByName,
    findAllNodesByPartialName,
    highlightNode,
    highlightNodeWithColor,
    highlightOrganByName,
    hideNode,
    showNode,
    resetMaterials,
    setMaterialTransparency,
    makeLayersTransparent,
    forceHideNodeGroups,
    lastClickedNode
  };
}
