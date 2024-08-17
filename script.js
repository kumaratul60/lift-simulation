let currLiftPositionArr = [];
let noOfFloors;
let noOfLifts;
let liftCallsQueue = [];
let intervalId;
let allLiftInfo;
let activeLiftsDestinations = [];

document.getElementById("submit-btn").addEventListener("click", (e) => {
  e.preventDefault();
  startVirtualSimulation();
});

function startVirtualSimulation() {
  clearInterval(intervalId);
  if (validateLiftAndFloorEntries()) {
    generateFloors(noOfFloors);
    generateLifts(noOfLifts);
    addButtonFunctionalities();
    intervalId = setInterval(fullFillLiftCallsQueue, 1000);
  }
}

const validateLiftAndFloorEntries = () => {
  // Get the values and parse them to integers
  noOfFloors = parseInt(document.getElementById("noOfFloors").value, 10);
  noOfLifts = parseInt(document.getElementById("noOfLifts").value, 10);

  // Validate number of floors
  if (isNaN(noOfFloors) || noOfFloors <= 0) {
    alert("Enter a valid number of floors.");
    return 0;
  }
  if (noOfFloors > 10) {
    alert("Only 10 floors are available currently.");
    return 0;
  }

  // Validate number of lifts
  if (isNaN(noOfLifts) || noOfLifts <= 0) {
    alert("Enter a valid number of lifts.");
    return 0;
  }
  if (noOfLifts > 10) {
    alert("Only 10 lifts are available currently.");
    return 0;
  }

  // Return 1 if all validations pass
  return 1;
};

const generateFloors = (n) => {
  const simulationArea = document.getElementById("simulationArea");
  simulationArea.innerHTML = ""; // Clear the area once

  // Create a DocumentFragment to hold all floors
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < n; i++) {
    const level = n - i - 1;
    const floorNo = `Level-${level}`;
    const currLevel = `L${level}`;

    // Create floor element
    const currFloor = document.createElement("div");
    currFloor.id = floorNo;
    currFloor.classList.add("floor");

    // Add content to floor element
    currFloor.innerHTML = `
      <p>${floorNo}</p>
      <div>
        <button id="up${currLevel}" class="button-floor up-btn">Up</button><br>
        <button id="down${currLevel}" class="button-floor down-btn">Down</button>
      </div>
    `;

    // Append floor to fragment
    fragment.appendChild(currFloor);
  }

  // Append all floors at once
  simulationArea.appendChild(fragment);
};

function addButtonFunctionalities() {
  const allButtons = document.querySelectorAll(".button-floor");
  allButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetFloor = parseInt(btn.id.slice(-1));
      if (!activeLiftsDestinations.includes(targetFloor)) {
        activeLiftsDestinations.push(targetFloor);
        liftCallsQueue.push(targetFloor);
      }
    });
  });
}

function translateLift(liftNo, targetLiftPos) {
  const reqLift = document.getElementById(`Lift-${liftNo}`);
  const currLiftPos = parseInt(currLiftPositionArr[liftNo], 10);

  if (currLiftPos === targetLiftPos) {
    allLiftInfo[liftNo].inMotion = false; // Set to false if no movement is needed
    animateLiftsDoors(liftNo, targetLiftPos);
    return;
  }

  allLiftInfo[liftNo].inMotion = true;

  const unitsToMove = Math.abs(targetLiftPos - currLiftPos) + 1;
  const motionDis = -100 * targetLiftPos;
  const transitionDuration = `${unitsToMove}s`;
  const timeInMs = unitsToMove * 1500;

  // Apply styles
  reqLift.style.transitionTimingFunction = "linear";
  reqLift.style.transform = `translateY(${motionDis}px)`;
  reqLift.style.transitionDuration = transitionDuration;

  // Update position after transition
  setTimeout(() => {
    currLiftPositionArr[liftNo] = targetLiftPos;
    animateLiftsDoors(liftNo, targetLiftPos);
  }, timeInMs);
}

function animateLiftsDoors(liftNo, targetLiftPos) {
  const leftGate = document.getElementById(`L${liftNo}left_gate`);
  const rightGate = document.getElementById(`L${liftNo}right_gate`);

  // Start the door animation
  leftGate.classList.add("door-animation");
  rightGate.classList.add("door-animation");

  setTimeout(() => {
    // End the door animation
    leftGate.classList.remove("door-animation");
    rightGate.classList.remove("door-animation");

    // Update lift motion status and active destinations
    allLiftInfo[liftNo].inMotion = false;
    activeLiftsDestinations = activeLiftsDestinations.filter((item) => item !== targetLiftPos);
  }, 1500);
}

function findNearestFreeLift(flrNo) {
  let smallestDifference = Number.MAX_SAFE_INTEGER;
  let nearestAvailableLift = -1;

  for (let i = 0; i < currLiftPositionArr.length; i++) {
    if (allLiftInfo[i].inMotion === false) {
      const currDiff = Math.abs(currLiftPositionArr[i] - flrNo);
      if (currDiff < smallestDifference) {
        smallestDifference = currDiff;
        nearestAvailableLift = i;
      }
    }
  }

  return nearestAvailableLift;
}

const generateLifts = (n) => {
  // Clear previous lift info
  allLiftInfo = [];

  const level0Element = document.getElementById("Level-0");

  for (let i = 0; i < n; i++) {
    const liftNo = `Lift-${i}`;
    const liftPositionX = (i + 1) * 90; // Position

    // Create lift element
    const currLift = document.createElement("div");
    currLift.id = liftNo;
    currLift.className = "lifts";
    currLift.style.left = `${liftPositionX}px`;
    currLift.style.top = "0px";
    currLift.innerHTML = `
      <div class="gate gateLeft" id="L${i}left_gate"></div>
      <div class="gate gateRight" id="L${i}right_gate"></div>
    `;

    level0Element.appendChild(currLift);

    // Initialize lift position
    currLiftPositionArr[i] = 0;

    // Add lift details
    allLiftInfo.push({
      id: liftNo,
      inMotion: false,
    });
  }
};

function fullFillLiftCallsQueue() {
  if (liftCallsQueue.length === 0) return;
  const targetFloor = liftCallsQueue.shift();
  const nearestLiftIndex = findNearestFreeLift(targetFloor);

  if (nearestLiftIndex !== -1) {
    // Move the lift to the target floor
    translateLift(nearestLiftIndex, targetFloor);
  }
}
