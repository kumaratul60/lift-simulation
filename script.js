const MAX_FLOORS = 50;
const MAX_LIFTS = 50;

// Lift and floor movement constants
const LIFT_WIDTH = 90; // in pixels, the width between lifts
const FLOOR_HEIGHT = 100; // in pixels, the height of each floor
const TRANSITION_TIME_PER_FLOOR = 2; // in seconds, time required to move between floors
const DOOR_OPERATION_TIME = 2500; // in milliseconds, time for doors to open or close

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

function validateLiftAndFloorEntries() {
  // Get the values and parse them to integers
  noOfFloors = parseInt(document.getElementById("noOfFloors").value, 10);
  noOfLifts = parseInt(document.getElementById("noOfLifts").value, 10);

  if (isNaN(noOfFloors) || noOfFloors <= 0 || noOfFloors > MAX_FLOORS) {
    alert(`Please enter a valid number of floors between 1 and ${MAX_FLOORS}.`);
    return false;
  }

  if (isNaN(noOfLifts) || noOfLifts < 1 || noOfLifts > MAX_LIFTS) {
    alert(`Please enter a valid number of lifts between 1 and ${MAX_LIFTS}.`);
    return false;
  }

  return true; // All validations pass
}

function generateFloors(n) {
  const simulationArea = document.getElementById("simulationArea");
  simulationArea.innerHTML = ""; // Clear the area once

  // Create a DocumentFragment to hold all floors
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < n; i++) {
    let level = n - i - 1; // Generate levels from top to bottom
    const floorNo = `Level: ${level}`;
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
         <hr/>
      </div>
    `;

    // Append floor to fragment
    fragment.appendChild(currFloor);
  }

  // Append all floors at once
  simulationArea.appendChild(fragment);
}

function generateLifts(n) {
  // Clear previous lift info
  allLiftInfo = [];
  const baseLevel = document.getElementById("Level: 0");
  if (!baseLevel) {
    console.error("Base level element not found. Ensure floors are generated before lifts.");
    return;
  }

  for (let i = 0; i < n; i++) {
    const liftNo = `Lift-${i}`;
    const liftPositionX = (i + 1) * LIFT_WIDTH; // Position calculation

    // Create lift element
    const currLift = document.createElement("div");
    currLift.id = liftNo;
    currLift.className = "lifts";
    currLift.style.left = `${liftPositionX}px`;
    currLift.style.top = "0px"; // Position at the bottom of the base level
    currLift.innerHTML = `
      <div class="gate gateLeft" id="L${i}left_gate"></div>
      <div class="gate gateRight" id="L${i}right_gate"></div>
    `;

    // Initialize lift position to the lowest floor
    currLiftPositionArr[i] = 0;

    // Add lift details
    allLiftInfo.push({
      id: liftNo,
      inMotion: false, // flag to track motion status
      doorsOpen: false, // flag to track door status
    });
    baseLevel.appendChild(currLift);
  }
}

function addButtonFunctionalities() {
  const allButtons = document.querySelectorAll(".button-floor");
  allButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // const targetFloor = parseInt(btn.id.slice(-1));

      // Extract floor number using regex
      const targetFloor = parseInt(btn.id.replace(/\D/g, ""), 10);

      if (!activeLiftsDestinations.includes(targetFloor)) {
        activeLiftsDestinations.push(targetFloor);
        liftCallsQueue.push(targetFloor);
      }
    });
  });

  // Disable the "Up" button on the topmost floor and the "Down" button on the lowest floor
  const topFloor = noOfFloors - 1;
  const bottomFloor = 0;

  document.getElementById(`upL${topFloor}`)?.setAttribute("disabled", "true");
  document.getElementById(`downL${bottomFloor}`)?.setAttribute("disabled", "true");
}

function translateLift(liftNo, targetLiftPos) {
  const liftInfo = allLiftInfo[liftNo];
  const reqLift = document.getElementById(`Lift-${liftNo}`);
  const currLiftPos = parseInt(currLiftPositionArr[liftNo], 10);

  // Handle doors open scenario by storing the request and exiting early
  if (liftInfo.doorsOpen) {
    console.log(`Lift-${liftNo} doors are open, storing request for floor ${targetLiftPos}.`);
    liftInfo.pendingRequest = targetLiftPos;
    return;
  }

  // Open doors immediately if the lift is already on the target floor
  if (currLiftPos === targetLiftPos) {
    // Set to false if no movement is needed
    liftInfo.inMotion = false;
    animateLiftsDoors(liftNo, targetLiftPos);
    return;
  }

  // Calculate movement details
  const unitsToMove = Math.abs(targetLiftPos - currLiftPos) + 1;
  const motionDis = FLOOR_HEIGHT * -1 * targetLiftPos;
  const transitionDuration = `${unitsToMove * TRANSITION_TIME_PER_FLOOR}s`;
  // timeInMs:duration (in milliseconds) required to traverse one floor.
  const timeInMs = unitsToMove * TRANSITION_TIME_PER_FLOOR * 1000;

  // Update lift status and apply movement styles
  liftInfo.inMotion = true;
  reqLift.style.transition = `transform ${transitionDuration} linear`;
  reqLift.style.transform = `translateY(${motionDis}px)`;

  // Update position after transition
  setTimeout(() => {
    currLiftPositionArr[liftNo] = targetLiftPos;
    liftInfo.inMotion = false;
    animateLiftsDoors(liftNo, targetLiftPos);
  }, timeInMs);
}

function animateLiftsDoors(liftNo, targetLiftPos) {
  const liftInfo = allLiftInfo[liftNo];
  const leftGate = document.getElementById(`L${liftNo}left_gate`);
  const rightGate = document.getElementById(`L${liftNo}right_gate`);

  const clearAnimationClasses = () => {
    leftGate.classList.remove("door-animation-open", "door-animation-close");
    rightGate.classList.remove("door-animation-open", "door-animation-close");
  };

  const applyAnimation = (action) => {
    leftGate.classList.add(`door-animation-${action}`);
    rightGate.classList.add(`door-animation-${action}`);
  };

  const closeDoors = () => {
    clearAnimationClasses();
    applyAnimation("close");

    setTimeout(() => {
      clearAnimationClasses();
      liftInfo.doorsOpen = false;

      if (liftInfo.pendingRequest !== undefined) {
        const pendingFloor = liftInfo.pendingRequest;
        liftInfo.pendingRequest = undefined;
        translateLift(liftNo, pendingFloor);
      } else {
        activeLiftsDestinations = activeLiftsDestinations.filter((item) => item !== targetLiftPos);
      }
    }, DOOR_OPERATION_TIME);
  };

  clearAnimationClasses();
  applyAnimation("open");
  liftInfo.doorsOpen = true;

  setTimeout(closeDoors, DOOR_OPERATION_TIME);
}

function findNearestFreeLift(flrNo) {
  let smallestDifference = Number.MAX_SAFE_INTEGER;
  let nearestAvailableLift = -1;

  for (let i = 0; i < currLiftPositionArr.length; i++) {
    if (!allLiftInfo[i].inMotion && !allLiftInfo[i].doorsOpen) {
      // Ensure lift is not in motion or with doors open
      const currDiff = Math.abs(currLiftPositionArr[i] - flrNo);
      if (currDiff < smallestDifference) {
        smallestDifference = currDiff;
        nearestAvailableLift = i;
      }
    }
  }

  return nearestAvailableLift;
}

function fullFillLiftCallsQueue() {
  if (liftCallsQueue.length === 0) return;
  for (let i = liftCallsQueue.length - 1; i >= 0; i--) {
    const targetFloor = liftCallsQueue[i];
    const nearestLiftIndex = findNearestFreeLift(targetFloor);

    if (nearestLiftIndex !== -1) {
      // Move the lift to the target floor
      liftCallsQueue.splice(i, 1); // Remove the request from the queue
      translateLift(nearestLiftIndex, targetFloor);
    }
  }
}
