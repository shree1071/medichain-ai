import os
import sys
import subprocess
try:
    import cv2
except ImportError:
    print("Please install opencv-python: pip install opencv-python")
    sys.exit(1)

def extract_dataset(youtube_url, output_folder="dataset", fps=1):
    """
    Downloads a YouTube video and extracts frames at the specified FPS.
    These frames can be uploaded directly to a Gaussian Splatting Hugging Face space.
    """
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        
    print(f"[*] Downloading YouTube video: {youtube_url}")
    video_path = "temp_video.mp4"
    
    # Use yt-dlp to download the video (best video quality, limit to 720p/1080p for speed)
    # We download the video only, no audio needed
    command = [
        sys.executable, "-m", "yt_dlp", 
        "-f", "bestvideo[ext=mp4][height<=1080]",
        "-o", video_path,
        youtube_url
    ]
    
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError:
        print("[!] Failed to download video. Ensure yt-dlp is installed and URL is valid.")
        return

    print(f"\n[*] Extracting frames at {fps} frame(s) per second...")
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print("[!] Failed to open the downloaded video.")
        return
        
    video_fps = cap.get(cv2.CAP_PROP_FPS)
    frame_interval = int(video_fps / fps)
    
    count = 0
    saved_count = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        if count % frame_interval == 0:
            frame_path = os.path.join(output_folder, f"frame_{saved_count:04d}.jpg")
            cv2.imwrite(frame_path, frame)
            saved_count += 1
            if saved_count % 10 == 0:
                print(f"    Saved {saved_count} frames...")
                
        count += 1
        
    cap.release()
    
    # Cleanup temporary video
    if os.path.exists(video_path):
        os.remove(video_path)
        
    print(f"\n[+] Success! Extracted {saved_count} overlapping frames into the '{output_folder}' directory.")
    print("[*] Next Step: Zip the 'dataset' folder and upload it to your Hugging Face space for COLMAP/Splatting.")

if __name__ == "__main__":
    print("=== Monastery 3D Dataset Generator ===")
    url = input("Enter a YouTube URL of a Monastery Walking Tour: ").strip()
    if url:
        extract_dataset(url, fps=2) # 2 frames per second gives excellent overlap for Splatting
    else:
        print("No URL provided. Exiting.")
