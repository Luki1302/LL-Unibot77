import { getDetections } from "./assets/video_process.js";
function letterChange() {
  const gridItem1Text = document.querySelector("#grid-item-1-text");
  let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let i = 0;
  setInterval(() => {
    gridItem1Text.innerHTML = alphabet[i];
    i = (i + 1) % alphabet.length;
  }, 1000);
}
function glyphChange() {
  const gridItem43Text = document.querySelector("#grid-item-4-3-text");
  const glyphs = "§≠æ⬏≥≈Ç–«œƒ;@+þ:π";
  let j = 0;
  setInterval(() => {
    gridItem43Text.innerHTML = glyphs[j];
    j = (j + 1) % glyphs.length;
  }, 1000);
}
const video = (window.video = document.getElementById("webcam_canvas"));
const canvas = (window.canvas = document.getElementById("out_canvas"));
canvas.width = 480;
canvas.height = 360;
const constraints = { audio: false, video: { width: 1280, height: 720 } };
function handleSuccess(stream) {
  window.stream = stream;
  video.srcObject = stream;
}
function handleError(error) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}
navigator.mediaDevices
  .getUserMedia(constraints)
  .then(handleSuccess)
  .catch(handleError);
let totalRotation = 0;
function angle2DFromCorners(det) {
  const dx = det.corners[1].x - det.corners[0].x;
  const dy = det.corners[1].y - det.corners[0].y;
  let rawAngle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let diff = rawAngle - (totalRotation % 360);
  if (diff > 180) {
    diff -= 360;
  } else if (diff < -180) {
    diff += 360;
  }
  totalRotation += diff;
  return totalRotation;
}
function updateSlide(slideId, valueId, value, min, max) {
  const clampedValue = Math.max(min, Math.min(max, value));
  const percentage = ((clampedValue - min) / (max - min)) * 100;
  const slideElement = document.getElementById(slideId);
  const valueElement = document.getElementById(valueId);
  if (slideElement) slideElement.style.width = percentage + "%";
  if (valueElement) valueElement.textContent = Math.round(clampedValue);
}
function mapValue(value, inMin, inMax, outMin, outMax) {
  if (inMax - inMin === 0) return outMin;
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
const crosshairXOffset = -270;
const crosshairYOffset = 0;
const crosshairXScale = 1.0;
const crosshairYScale = 1.0;
let countdownValue = 5;
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownNumber = document.getElementById("countdown-number");
const colors = ["#9463e5", "#7fff29"];
let startTime = null;
function animateCountdown(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = (timestamp - startTime) / 1000;
  let currentCountdown = Math.max(0, 5 - elapsed);
  countdownNumber.textContent =
    currentCountdown > 0 ? Math.ceil(currentCountdown) : "GO";
  const weightVal = mapValue(currentCountdown, 5, 0, 57, 228);
  const slantVal = mapValue(currentCountdown, 5, 0, 0, 10);
  countdownNumber.style.fontVariationSettings = `'wght' ${weightVal}, 'ital' ${slantVal}`;
  const countFromZero = Math.floor(Math.min(5, elapsed));
  const colorIndex = countFromZero % colors.length;
  countdownNumber.style.color = colors[colorIndex];
  if (elapsed < 5) {
    requestAnimationFrame(animateCountdown);
  } else {
    countdownOverlay.classList.add("fade-out");
    setTimeout(() => {
      countdownOverlay.remove();
      letterChange();
      setTimeout(glyphChange, 500);
      startGraphTimer();
    }, 500);
  }
}
requestAnimationFrame(animateCountdown);
function loop() {
  requestAnimationFrame(loop);
  const detections = getDetections();
  if (!detections || detections.length === 0) return;
  const detection1 = detections.find((d) => d.id === 1);
  const detection2 = detections.find((d) => d.id === 2);
  const vidW = video.videoWidth || constraints.video.width || 1280;
  const vidH = video.videoHeight || constraints.video.height || 720;
  function processDetection(
    det,
    slidePrefix,
    elementIds,
    arrowId,
    crossPrefix
  ) {
    if (!det) {
      const crossX = document.getElementById(`${crossPrefix}-x`);
      const crossY = document.getElementById(`${crossPrefix}-y`);
      if (crossX) crossX.style.display = "none";
      if (crossY) crossY.style.display = "none";
      return;
    }
    const rawCenterX = (det.corners[0].x + det.corners[2].x) / 2;
    const rawCenterY = (det.corners[0].y + det.corners[2].y) / 2;
    const scaleX = canvas.width / vidW;
    const scaleY = canvas.height / vidH;
    let scaledX = rawCenterX * scaleX;
    let scaledY = rawCenterY * scaleY;
    const center = { x: scaledX, y: scaledY };
    const weightVal = mapValue(center.x, 0, canvas.width, 57, 228);
    const slantedVal = mapValue(center.y, 0, canvas.height, 0, 10);
    updateSlide(
      `slide-weight-${slidePrefix}`,
      `value-weight-${slidePrefix}`,
      weightVal,
      57,
      228
    );
    updateSlide(
      `slide-slanted-${slidePrefix}`,
      `value-slanted-${slidePrefix}`,
      slantedVal,
      0,
      10
    );
    elementIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.style.fontVariationSettings = `'wght' ${weightVal}, 'ital' ${slantedVal}`;
    });
    const angle = angle2DFromCorners(det);
    const arrow = document.getElementById(arrowId);
    if (arrow) {
      arrow.style.animation = "none";
      arrow.style.transform = `rotate(${angle}deg)`;
      arrow.style.fontVariationSettings = `'wght' ${weightVal}`;
    }
    let displayX = center.x * crosshairXScale + crosshairXOffset;
    let displayY = center.y * crosshairYScale + crosshairYOffset;
    displayX = Math.max(0, Math.min(canvas.width, displayX));
    displayY = Math.max(0, Math.min(canvas.height, displayY));
    const crossX = document.getElementById(`${crossPrefix}-x`);
    const crossY = document.getElementById(`${crossPrefix}-y`);
    if (crossX) {
      crossX.style.display = "block";
      crossX.style.left = `${displayX}px`;
    }
    if (crossY) {
      crossY.style.display = "block";
      crossY.style.top = `${displayY}px`;
    }
  }
  processDetection(
    detection1,
    "green",
    ["grid-item-4-3-text", "line-1", "line-3"],
    "grid-item-2-2-text",
    "cross-green"
  );
  if (detection1) {
    const consultText3 = document.querySelector(
      "#grid-item-2-2-consult-text-3 p"
    );
    if (consultText3) {
      const rawCenterX =
        (detection1.corners[0].x + detection1.corners[2].x) / 2;
      const rawCenterY =
        (detection1.corners[0].y + detection1.corners[2].y) / 2;
      const scaleX = canvas.width / vidW;
      const scaleY = canvas.height / vidH;
      const x = rawCenterX * scaleX;
      const y = rawCenterY * scaleY;
      const midX = canvas.width / 2;
      const midY = canvas.height / 2;
      const distToCenter = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
      const corners = [
        Math.sqrt(x ** 2 + y ** 2),
        Math.sqrt((canvas.width - x) ** 2 + y ** 2),
        Math.sqrt(x ** 2 + (canvas.height - y) ** 2),
        Math.sqrt((canvas.width - x) ** 2 + (canvas.height - y) ** 2),
      ];
      const minCornerDist = Math.min(...corners);
      let distToOther = 0;
      if (detection2) {
        const otherX =
          ((detection2.corners[0].x + detection2.corners[2].x) / 2) *
          (canvas.width / vidW);
        const otherY =
          ((detection2.corners[0].y + detection2.corners[2].y) / 2) *
          (canvas.height / vidH);
        distToOther = Math.sqrt((x - otherX) ** 2 + (y - otherY) ** 2);
      }
      if (!window.startTime) window.startTime = performance.now();
      const elapsed = (performance.now() - window.startTime) / 1000;
      const values = [
        x.toFixed(3),
        y.toFixed(3),
        distToCenter.toFixed(3),
        minCornerDist.toFixed(3),
        distToOther.toFixed(3),
        elapsed.toFixed(3),
      ];
      consultText3.innerHTML = values.join("<br>");
    }
  }
  processDetection(
    detection2,
    "violet",
    ["grid-item-1-text", "line-2", "line-4"],
    "grid-item-4-4-text",
    "cross-violet"
  );
  if (detection2) {
    const consultText = document.querySelector(
      "#grid-item-2-2-consult-text-2 p"
    );
    if (consultText) {
      const rawCenterX =
        (detection2.corners[0].x + detection2.corners[2].x) / 2;
      const rawCenterY =
        (detection2.corners[0].y + detection2.corners[2].y) / 2;
      const scaleX = canvas.width / vidW;
      const scaleY = canvas.height / vidH;
      const x = rawCenterX * scaleX;
      const y = rawCenterY * scaleY;
      const midX = canvas.width / 2;
      const midY = canvas.height / 2;
      const distToCenter = Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
      const corners = [
        Math.sqrt(x ** 2 + y ** 2),
        Math.sqrt((canvas.width - x) ** 2 + y ** 2),
        Math.sqrt(x ** 2 + (canvas.height - y) ** 2),
        Math.sqrt((canvas.width - x) ** 2 + (canvas.height - y) ** 2),
      ];
      const minCornerDist = Math.min(...corners);
      let distToOther = 0;
      if (detection1) {
        const otherX =
          ((detection1.corners[0].x + detection1.corners[2].x) / 2) *
          (canvas.width / vidW);
        const otherY =
          ((detection1.corners[0].y + detection1.corners[2].y) / 2) *
          (canvas.height / vidH);
        distToOther = Math.sqrt((x - otherX) ** 2 + (y - otherY) ** 2);
      }
      if (!window.startTime) window.startTime = performance.now();
      const elapsed = (performance.now() - window.startTime) / 1000;
      const values = [
        x.toFixed(3),
        y.toFixed(3),
        distToCenter.toFixed(3),
        minCornerDist.toFixed(3),
        distToOther.toFixed(3),
        elapsed.toFixed(3),
      ];
      consultText.innerHTML = values.join("<br>");
    }
  }
}
loop();
const canvasChart = document.getElementById("tracking-chart");
const ctx = canvasChart.getContext("2d");
const dpr = window.devicePixelRatio || 1;
canvasChart.width = canvasChart.clientWidth * dpr;
canvasChart.height = canvasChart.clientHeight * dpr;
ctx.scale(dpr, dpr);
ctx.imageSmoothingEnabled = false;
const timeData = [];
const greenData = [];
const violetData = [];
const trackingChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: timeData,
    datasets: [
      {
        label: "",
        data: greenData,
        borderColor: "#7fff29",
        borderWidth: 1,
        fill: false,
        tension: 0,
        pointRadius: 0,
      },
      {
        label: "",
        data: violetData,
        borderColor: "#9463e5",
        borderWidth: 1,
        fill: false,
        tension: 0,
        pointRadius: 0,
      },
    ],
  },
  options: {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 8,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: {
        ticks: {
          color: "#000",
          font: { size: 8.5, family: "HGKBUnica77", weight: 90 },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          autoSkipPadding: 10,
          maxTicksLimit: 13,
        },
        grid: { color: "#000", lineWidth: 0.5 },
        border: { color: "#000", width: 0.5 },
        min: 0,
        max: 60,
      },
      y: {
        ticks: {
          stepSize: 0.2,
          color: "#000",
          font: { size: 8.5, family: "HGKBUnica77", weight: "regular" },
        },
        grid: { color: "#000", lineWidth: 0.5 },
        border: { color: "#000", width: 0.5 },
        beginAtZero: true,
      },
    },
  },
});
function startGraphTimer() {
  let elapsedSeconds = 0;
  let maxObservedDist = 0;
  const graphInterval = setInterval(() => {
    const detections = getDetections();
    if (!detections) return;
    const detection1 = detections.find((d) => d.id === 1);
    const detection2 = detections.find((d) => d.id === 2);
    const vidW = video.videoWidth || 1280;
    const vidH = video.videoHeight || 720;
    const scaleX = canvas.width / vidW;
    const scaleY = canvas.height / vidH;
    const midX = canvas.width / 2;
    const midY = canvas.height / 2;
    function distToCenter(det) {
      if (!det) return null;
      const x = ((det.corners[0].x + det.corners[2].x) / 2) * scaleX;
      const y = ((det.corners[0].y + det.corners[2].y) / 2) * scaleY;
      return Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
    }
    const distGreen = distToCenter(detection1);
    const distViolet = distToCenter(detection2);
    if (distGreen && distGreen > maxObservedDist) maxObservedDist = distGreen;
    if (distViolet && distViolet > maxObservedDist)
      maxObservedDist = distViolet;
    function proximity(dist) {
      if (!dist || maxObservedDist === 0) return null;
      return 1 - dist / maxObservedDist;
    }
    elapsedSeconds++;
    timeData.push(elapsedSeconds);
    greenData.push(proximity(distGreen));
    violetData.push(proximity(distViolet));
    trackingChart.update("none");
    if (elapsedSeconds >= 60) clearInterval(graphInterval);
  }, 1000);
}
function recordDistances() {
  const detections = getDetections();
  if (!detections) return;
  const detection1 = detections.find((d) => d.id === 1);
  const detection2 = detections.find((d) => d.id === 2);
  const vidW = video.videoWidth || constraints.video.width || 1280;
  const vidH = video.videoHeight || constraints.video.height || 720;
  const scaleX = canvas.width / vidW;
  const scaleY = canvas.height / vidH;
  const midX = canvas.width / 2;
  const midY = canvas.height / 2;
  function distToCenter(det) {
    if (!det) return null;
    const x = ((det.corners[0].x + det.corners[2].x) / 2) * scaleX;
    const y = ((det.corners[0].y + det.corners[2].y) / 2) * scaleY;
    return Math.sqrt((x - midX) ** 2 + (y - midY) ** 2);
  }
  const distGreen = distToCenter(detection1);
  const distViolet = distToCenter(detection2);
  if (distGreen && distGreen > maxObservedDist) maxObservedDist = distGreen;
  if (distViolet && distViolet > maxObservedDist) maxObservedDist = distViolet;
  function proximity(dist) {
    if (!dist || maxObservedDist === 0) return null;
    return 1 - dist / maxObservedDist;
  }
  const proxGreen = proximity(distGreen);
  const proxViolet = proximity(distViolet);
  elapsedSeconds++;
  timeData.push(elapsedSeconds);
  greenData.push(proxGreen ?? null);
  violetData.push(proxViolet ?? null);
  trackingChart.update("none");
}
setTimeout(recordDistances, 1000);
