// Constants for lift and floor limits
const MIN_FLOORS = -5;
const MAX_FLOORS = 50;
const MIN_LIFTS = 1;
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

  if (isNaN(noOfFloors) || noOfFloors === 0 || noOfFloors < MIN_FLOORS || noOfFloors > MAX_FLOORS) {
    alert(`Enter a valid number of floors between ${MIN_FLOORS} and ${MAX_FLOORS}.`);
    return 0;
  }

  if (isNaN(noOfLifts) || noOfLifts < MIN_LIFTS || noOfLifts > MAX_LIFTS) {
    alert(`Enter a valid number of lifts between ${MIN_LIFTS} and ${MAX_LIFTS}.`);
    return 0;
  }

  // Return 1 if all validations pass
  return 1;
}

function generateFloors(n) {
  const simulationArea = document.getElementById("simulationArea");
  simulationArea.innerHTML = ""; // Clear the area once

  // Create a DocumentFragment to hold all floors
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < Math.abs(n); i += 1) {
    let level = n > 0 ? n - i - 1 : -i;
    const floorNo = `Level:${level}`;
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

  const baseLevel = document.getElementById("Level:0");

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

      // hanlde negative number
      const targetFloor = parseInt(btn.id.match(/-?\d+/)[0], 10);

      if (!activeLiftsDestinations.includes(targetFloor)) {
        activeLiftsDestinations.push(targetFloor);
        liftCallsQueue.push(targetFloor);
      }
    });
  });

  // Disable "Up" button on the topmost floor
  const topFloor = noOfFloors > 0 ? noOfFloors - 1 : 0;
  const topUpButton = document.getElementById(`upL${topFloor}`);
  if (topUpButton) {
    topUpButton.disabled = true;
  }

  // Disable "Down" button on the lowest floor
  const bottomFloor = noOfFloors > 0 ? 0 : -Math.abs(noOfFloors) + 1;
  const bottomDownButton = document.getElementById(`downL${bottomFloor}`);
  if (bottomDownButton) {
    bottomDownButton.disabled = true;
  }
}

function translateLift(liftNo, targetLiftPos) {
  const liftInfo = allLiftInfo[liftNo];
  const reqLift = document.getElementById(`Lift-${liftNo}`);
  const currLiftPos = parseInt(currLiftPositionArr[liftNo], 10);
  console.log(liftInfo);

  // if (liftInfo.doorsOpen) {
  //   console.log(`Lift ${liftNo} cannot move because doors are open.`);
  //   return; // Exit if doors are open
  // }

  if (currLiftPos === targetLiftPos) {
    // Set to false if no movement is needed
    liftInfo.inMotion = false;
    animateLiftsDoors(liftNo, targetLiftPos);
    return;
  }

  liftInfo.inMotion = true;

  const unitsToMove = Math.abs(targetLiftPos - currLiftPos) + 1;
  const motionDis = FLOOR_HEIGHT * -1 * targetLiftPos;
  const transitionDuration = `${unitsToMove * TRANSITION_TIME_PER_FLOOR}s`;
  // timeInMs:duration (in milliseconds) required to traverse one floor.
  const timeInMs = unitsToMove * TRANSITION_TIME_PER_FLOOR * 1000;

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
  const liftInfo = allLiftInfo[liftNo];
  const leftGate = document.getElementById(`L${liftNo}left_gate`);
  const rightGate = document.getElementById(`L${liftNo}right_gate`);

  // Ensure that any previous animations are cleared
  leftGate.classList.remove("door-animation-close", "door-animation-open");
  rightGate.classList.remove("door-animation-close", "door-animation-open");

  // Start the door opening animation
  leftGate.classList.add("door-animation-open");
  rightGate.classList.add("door-animation-open");

  // Set doorsOpen flag to true
  liftInfo.doorsOpen = true;

  // Wait 2.5 seconds for the doors to fully open
  setTimeout(() => {
    // Stop the opening animation
    leftGate.classList.remove("door-animation-open");
    rightGate.classList.remove("door-animation-open");

    // Start the door closing animation after a delay of 2.5 seconds
    leftGate.classList.add("door-animation-close");
    rightGate.classList.add("door-animation-close");

    setTimeout(() => {
      // End the door closing animation
      leftGate.classList.remove("door-animation-close");
      rightGate.classList.remove("door-animation-close");

      // Update lift motion status and active destinations
      liftInfo.inMotion = false;
      liftInfo.doorsOpen = false; // Set doorsOpen flag to false
      activeLiftsDestinations = activeLiftsDestinations.filter((item) => item !== targetLiftPos);
    }, DOOR_OPERATION_TIME); // Time for doors to close
  }, DOOR_OPERATION_TIME); // Time for doors to stay open
}

function findNearestFreeLift(flrNo, skipIndex = -1) {
  let smallestDifference = Number.MAX_SAFE_INTEGER;
  let nearestAvailableLift = -1;

  for (let i = 0; i < currLiftPositionArr.length; i++) {
    if (!allLiftInfo[i].inMotion) {
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
  const targetFloor = liftCallsQueue.shift();
  const nearestLiftIndex = findNearestFreeLift(targetFloor);

  if (nearestLiftIndex !== -1) {
    // Move the lift to the target floor
    translateLift(nearestLiftIndex, targetFloor);
  }
}
