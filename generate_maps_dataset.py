import os
import sys
try:
    from streetlevel import streetview
except ImportError:
    print("Please install streetlevel: pip install streetlevel")
    sys.exit(1)

def download_maps_data(lat, lon, radius=50, output_folder="maps_dataset"):
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    print(f"[*] Searching Google Maps for 360 photos within {radius}m of ({lat}, {lon})...")
    
    # Find panoramas
    panos = streetview.find_panorama(lat, lon, radius=radius)
    
    if not panos:
        print("[!] No Google Maps panoramas found in this area. Try increasing the radius.")
        return
        
    # streetview.find_panorama returns a list of panos or a single pano depending on the API.
    # Usually it returns the closest one. Let's try to get multiple if possible, or just the one.
    if not isinstance(panos, list):
        panos = [panos]
        
    print(f"[+] Found {len(panos)} panorama(s). Downloading...")
    
    for i, pano in enumerate(panos):
        print(f"    Downloading Pano ID: {pano.id}...")
        # Download highest quality equirectangular image
        streetview.download_panorama(pano, f"{output_folder}/pano_{i}.jpg")
        
    print(f"\n[+] Success! Saved Google Maps photos to '{output_folder}'.")
    print("[*] Note: You will need to slice these 360 images into standard 2D photos for COLMAP to process them properly.")

if __name__ == "__main__":
    print("=== Google Maps 3D Dataset Generator ===")
    print("Default coordinates are for Rumtek Monastery.")
    lat_input = input("Enter Latitude (default: 27.3013): ").strip()
    lon_input = input("Enter Longitude (default: 88.5204): ").strip()
    
    lat = float(lat_input) if lat_input else 27.3013
    lon = float(lon_input) if lon_input else 88.5204
    
    download_maps_data(lat, lon, radius=100)
