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
    (nodeId: number, color: [number, number, number], emissiveStrength = 2.0) => {
      if (!api || !nodes[nodeId]) return;
      const node = nodes[nodeId];
      const nodeLower = node.name.toLowerCase().replace(/system|_| /g, '');

      let applied = 0;
      materials.forEach((mat) => {
        const matLower = (mat.name || '').toLowerCase().replace(/system|_| /g, '');
        if (matLower.includes(nodeLower) || nodeLower.includes(matLower)) {
          const tinted = JSON.parse(JSON.stringify(mat));

          // Emissive glow
          if (tinted.channels.EmitColor) {
            tinted.channels.EmitColor.enable = true;
            tinted.channels.EmitColor.factor = emissiveStrength;
            tinted.channels.EmitColor.color = [...color];
          }
          if (tinted.channels.AlbedoPBR) {
            tinted.channels.AlbedoPBR.factor = 1.0;
            tinted.channels.AlbedoPBR.color = [...color];
          }
          if (tinted.channels.DiffuseColor) {
            tinted.channels.DiffuseColor.factor = 1.0;
            tinted.channels.DiffuseColor.color = [...color];
          }

          api.setMaterial(tinted, () => {});
          applied++;
        }
      });
    },
    [api, nodes, materials]
  );

  const highlightNode = useCallback(
    (nodeId: number) => {
      highlightNodeWithColor(nodeId, [0.0, 1.0, 1.0], 1.0);
    },
    [highlightNodeWithColor]
  );

  // ─── MATERIAL TRANSPARENCY ────────────────────────────────────
  const setMaterialTransparency = useCallback(
    (materialName: string, opacity: number) => {
      if (!api) return;
      const lower = materialName.toLowerCase();
      materials.forEach((mat) => {
        if ((mat.name || '').toLowerCase().includes(lower)) {
          const t = JSON.parse(JSON.stringify(mat));
          if (t.channels.Opacity) {
            t.channels.Opacity.enable = true;
            t.channels.Opacity.factor = opacity;
          }
          if (t.channels.AlbedoPBR) {
            t.channels.AlbedoPBR.factor = opacity;
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
    nodes,
    error,
    materials,
    findNodeIdByName,
    findAllNodesByPartialName,
    highlightNode,
    highlightNodeWithColor,
    hideNode,
    showNode,
    resetMaterials,
    setMaterialTransparency,
    makeLayersTransparent,
    forceHideNodeGroups,
    lastClickedNode
  };
}
