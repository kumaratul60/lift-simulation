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

  if (isNaN(noOfFloors) || noOfFloors < -5 || noOfFloors === 0 || noOfFloors > 10) {
    alert("Enter a valid number of floors between -5 and 10.");
    return 0;
  }

  if (isNaN(noOfLifts) || noOfLifts <= 0 || noOfLifts > 10) {
    alert("Enter a valid number of lifts between 1 and 10.");
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
    const liftPositionX = (i + 1) * 90; // Position calculation

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

    baseLevel.appendChild(currLift);

    // Initialize lift position to the lowest floor
    currLiftPositionArr[i] = 0;

    // Add lift details
    allLiftInfo.push({
      id: liftNo,
      inMotion: false, // flag to track motion status
      doorsOpen: false, // flag to track door status
    });
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
}

function translateLift(liftNo, targetLiftPos) {
  const liftInfo = allLiftInfo[liftNo];
  const reqLift = document.getElementById(`Lift-${liftNo}`);
  const currLiftPos = parseInt(currLiftPositionArr[liftNo], 10);

  // if (currLiftPos === targetLiftPos) {
  //   allLiftInfo[liftNo].inMotion = false; // Set to false if no movement is needed
  //   animateLiftsDoors(liftNo, targetLiftPos);
  //   return;
  // }

  // allLiftInfo[liftNo].inMotion = true;

  if (liftInfo.doorsOpen) {
    console.log(`Lift ${liftNo} cannot move because doors are open.`);
    return; // Exit if doors are open
  }

  if (currLiftPos === targetLiftPos) {
    liftInfo.inMotion = false; // Set to false if no movement is needed
    animateLiftsDoors(liftNo, targetLiftPos);
    return;
  }

  liftInfo.inMotion = true;

  const unitsToMove = Math.abs(targetLiftPos - currLiftPos) + 1;
  const motionDis = 100 * -1 * targetLiftPos;
  const transitionDuration = `${unitsToMove}s`;
  // timeInMs:duration (in milliseconds) required to traverse one floor.
  const timeInMs = unitsToMove * 2000;

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
    }, 2500); // Time for doors to close
  }, 2500); // Time for doors to stay open
}

function findNearestFreeLift(flrNo) {
  let smallestDifference = Number.MAX_SAFE_INTEGER;
  let nearestAvailableLift = -1;

  for (let i = 0; i < currLiftPositionArr.length; i++) {
    // if (allLiftInfo[i].inMotion === false) {
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
