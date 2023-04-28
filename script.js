const audioFileInput = document.getElementById("audio-file");
const visualizationCanvas = document.getElementById("visualization");
const exportBtn = document.getElementById("export-btn");
const styleSelect = document.getElementById("style-select");
const canvasCtx = visualizationCanvas.getContext("2d", { alpha: true });

audioFileInput.addEventListener("change", handleAudioUpload);
exportBtn.addEventListener("click", exportVideo);

function handleAudioUpload(event) {
    const file = event.target.files[0];
    audioContext = new AudioContext();
    source = audioContext.createBufferSource();

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = function () {
        audioContext.decodeAudioData(fileReader.result, function (buffer) {
            source.buffer = buffer;
            source.connect(audioContext.destination);

            const analyser = audioContext.createAnalyser();
            source.connect(analyser);
            analyser.fftSize = 64;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            visualizationCanvas.width = window.innerWidth;
            visualizationCanvas.height = 400;
            console.log(styleSelect.value);
            switch (styleSelect.value) {
                case "classic":
                    function draw() {
                        canvasCtx.clearRect(0, 0, visualizationCanvas.width, visualizationCanvas.height);
                
                        analyser.getByteFrequencyData(dataArray);
                
                        const barWidth = visualizationCanvas.width / bufferLength;
                        let barHeight;
                        let x = 0;
                
                        for (let i = 0; i < bufferLength; i++) {
                          barHeight = dataArray[i];
                          canvasCtx.fillStyle = `hsl(${i / bufferLength * 360}, 100%, 50%)`;
                          canvasCtx.fillRect(x, visualizationCanvas.height - barHeight, barWidth, barHeight);
                          x += barWidth + 1;
                        }
                
                        requestAnimationFrame(draw);
                      }
                    break;
                case "circle":
                    /*
                        Centered Line Visualization
                    */
                        function draw() {
                            canvasCtx.clearRect(0, 0, visualizationCanvas.width, visualizationCanvas.height);
                    
                            analyser.getByteFrequencyData(dataArray);
                    
                            const barWidth = visualizationCanvas.width / (bufferLength * 2);
                            let barHeight;
                    
                            for (let i = 0; i < 30; i++) {
                              barHeight = dataArray[i];
                              canvasCtx.fillStyle = `hsl(${i / bufferLength * 360}, 100%, 50%)`;
                    
                              const leftX = visualizationCanvas.width / 2 - (i * barWidth * 2) - barWidth;
                              const rightX = visualizationCanvas.width / 2 + (i * barWidth * 2);
                    
                              canvasCtx.fillRect(leftX, visualizationCanvas.height - barHeight, barWidth, barHeight);
                              canvasCtx.fillRect(rightX, visualizationCanvas.height - barHeight, barWidth, barHeight);
                            }
                    
                            requestAnimationFrame(draw);
                          }
                          
                    break;
                case "circleOutline":
                    /*
                    360 Circle Visualization
                    */
                    function draw() {
                        canvasCtx.clearRect(0, 0, visualizationCanvas.width, visualizationCanvas.height);
                      
                        analyser.getByteFrequencyData(dataArray);
                      
                        const centerX = visualizationCanvas.width / 2;
                        const centerY = visualizationCanvas.height / 2;
                        const radius = 100;
                        const segments = 20;
                        const lineWidth = 10; // You can adjust this value to change the width of the lines
                      
                        for (let i = 0; i < segments; i++) {
                          const value = dataArray[i];
                          const ratio = value / 255;
                          const hue = i / segments * 360;
                      
                          const startAngle = (i / segments) * 2 * Math.PI;
                          const endAngle = ((i + 1) / segments) * 2 * Math.PI;
                      
                          const innerRadius = radius;
                          const outerRadius = radius + ratio * radius;
                      
                          canvasCtx.beginPath();
                          canvasCtx.arc(centerX, centerY, innerRadius, startAngle, endAngle, false);
                          canvasCtx.arc(centerX, centerY, outerRadius, endAngle, startAngle, true);
                          canvasCtx.closePath();
                      
                          const gradient = canvasCtx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius);
                          gradient.addColorStop(0, `hsla(${hue}, 100%, 50%, 1)`);
                          gradient.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
                          canvasCtx.fillStyle = gradient;
                          canvasCtx.fill();
                      
                          canvasCtx.lineWidth = lineWidth;
                          canvasCtx.strokeStyle = `hsla(${hue}, 100%, 50%, 1)`;
                          canvasCtx.stroke();
                        }
                      
                        requestAnimationFrame(draw);
                      }                      
                    break;

                default:
            }

            draw();
            source.start(0);
        });
    };
}

function exportVideo() {
    const mimeType = "video/webm;codecs=vp9,opus";
    const mediaRecorder = new MediaRecorder(visualizationCanvas.captureStream(), { mimeType });

    const chunks = [];
    mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
        }
    });

    mediaRecorder.addEventListener("stop", () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "visualization.webm";
        link.click();
        URL.revokeObjectURL(url);
    });

    const duration = (visualizationCanvas.duration * 1000) || 10000; // default to 10 seconds if duration is not available
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), duration);
}
