#!/bin/sh
set -eu
indices='000 004 006 008 011 013 015 017 020 024 026 028 031 033 035 038'
build_sprite() {
  directory=$1
  prefix=$2
  output=$3
  files=''
  for index in $indices; do files="$files $directory/${prefix}_${index}.png"; done
  # The fixed asset paths contain no whitespace.
  magick montage $files -background none -tile 4x4 -geometry 430x541+0+0 "$output"
}
build_video() {
  directory=$1
  prefix=$2
  fps=$3
  output=$4
  duration=$(awk -v fps="$fps" 'BEGIN { printf "%.6f", 42 / fps }')
  ffmpeg -y -hide_banner -loglevel error \
    -f lavfi -i "color=c=0xEAF1F8:s=860x1082:r=$fps:d=$duration" \
    -framerate "$fps" -start_number 0 -i "$directory/${prefix}_%03d.png" \
    -filter_complex '[1:v]scale=860:1082:flags=lanczos[char];[0:v][char]overlay=shortest=1:format=auto,format=yuv420p' \
    -c:v libx264 -preset medium -crf 19 -profile:v baseline -level 3.2 -movflags +faststart -an \
    "$output"
}
build_sprite assets/animations/pip-sofa-study/exports pip-typing assets/experiments/video-animation/pip-typing-sprites.png
build_sprite assets/animations/study-together-reading/exports pip-reading assets/experiments/video-animation/pip-reading-sprites.png
build_sprite assets/animations/study-together-writing/exports pip-writing assets/experiments/video-animation/pip-writing-sprites.png
build_sprite assets/animations/study-together-headphones/exports pip-headphones assets/experiments/video-animation/pip-headphones-sprites.png
build_video assets/animations/pip-sofa-study/exports pip-typing 12 assets/experiments/video-animation/pip-typing-h264.mp4
build_video assets/animations/study-together-reading/exports pip-reading 10 assets/experiments/video-animation/pip-reading-h264.mp4
build_video assets/animations/study-together-writing/exports pip-writing 12 assets/experiments/video-animation/pip-writing-h264.mp4
build_video assets/animations/study-together-headphones/exports pip-headphones 9 assets/experiments/video-animation/pip-headphones-h264.mp4
