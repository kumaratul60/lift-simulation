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
  noOfFloors = document.getElementById("noOfFloors").value;
  noOfLifts = document.getElementById("noOfLifts").value;
  // console.log(`no-Floors is ${noOfFloors.value} no-Lifts is ${noOfLifts}`)

  if (isNaN(noOfFloors)) {
    alert("Enter a valid no of Floor");
    return 0;
  }
  noOfFloors = parseInt(noOfFloors);
  if (noOfFloors > 10) {
    alert("Only 10 Floor available currently");
    return 0;
  }

  if (isNaN(noOfLifts)) {
    alert("Enter a valid no of Lifts");
    return 0;
  }
  noOfLifts = parseInt(noOfLifts);
  if (noOfLifts > 10) {
    alert("Only 10 Lifts available currently");
    return 0;
  }
  return 1;
};

const generateFloors = (n) => {
  document.getElementById("simulationArea").innerHTML = "";
  for (let i = 0; i < n; i++) {
    let currLevel = `L${n - i - 1}`;
    let floorNo = `Level-${n - i - 1}`;
    let currFloor = document.createElement("div");
    currFloor.setAttribute("id", floorNo);

    currFloor.classList.add("floor");
    currFloor.innerHTML = `
        <p>${floorNo}</p>
        <div>
        <button id=up${currLevel} class=" button-floor up-btn">Up</button><br>
        <button id=down${currLevel} class="button-floor down-btn">Down</button>
        </div>
        `;
    document.getElementById("simulationArea").appendChild(currFloor);
  }
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

function translateLiftOld(liftNo, targetLiftPos) {
  let reqLift = document.getElementById(`Lift-${liftNo}`);
  let currLiftPos = parseInt(currLiftPositionArr[liftNo]);
  var anim = setInterval(animate, 100);

  function animate() {
    if (currLiftPos != targetLiftPos) {
      stepVector = parseInt(Math.sign(targetLiftPos - currLiftPos));
      currLiftPos += stepVector;
      let intermediateFloor = `${currLiftPos * 100 * -1}px`;
      // console.log(intermediateFloor);
      reqLift.style.transform = `translateY(100 * -1 px)`;
      reqLift.style.transitionDuration = `2s`;
    } else {
      currLiftPositionArr[liftNo] = targetLiftPos;
      clearInterval(anim);
    }
  }
}

function translateLift(liftNo, targetLiftPos) {
  const reqLift = document.getElementById(`Lift-${liftNo}`);
  let currLiftPos = parseInt(currLiftPositionArr[liftNo]);

  if (currLiftPos != targetLiftPos) {
    allLiftInfo[liftNo].inMotion = true;
    let unitsToMove = Math.abs(targetLiftPos - currLiftPos) + 1;
    let motionDis = 100 * -1 * targetLiftPos;
    // console.log("🚀 ~  motionDis", motionDis);

    reqLift.style.transitionTimingFunction = "linear";
    reqLift.style.transform = `translateY(${motionDis}px)`;
    reqLift.style.transitionDuration = `${unitsToMove * 1}s`;

    let timeInMs = unitsToMove * 1500;
    setTimeout(() => {
      currLiftPositionArr[liftNo] = targetLiftPos;
      animateLiftsDoors(liftNo, targetLiftPos);
    }, timeInMs);
  } else {
    allLiftInfo[liftNo].inMotion = true;
    animateLiftsDoors(liftNo, targetLiftPos);
  }
}

function animateLiftsDoors(liftNo, targetLiftPos) {
  const leftGate = document.getElementById(`L${liftNo}left_gate`);
  const rightGate = document.getElementById(`L${liftNo}right_gate`);
  leftGate.classList.toggle("animateLiftsDoorsOnFloorStop");
  rightGate.classList.toggle("animateLiftsDoorsOnFloorStop");

  setTimeout(() => {
    allLiftInfo[liftNo].inMotion = false;
    leftGate.classList.toggle("animateLiftsDoorsOnFloorStop");
    rightGate.classList.toggle("animateLiftsDoorsOnFloorStop");
    activeLiftsDestinations = activeLiftsDestinations.filter(
      (item) => item !== targetLiftPos
    );
  }, 2500);
}

function findNearestFreeLift(flrNo) {
  let prevDiff = Number.MAX_SAFE_INTEGER;
  //   console.log("🚀 ~ file: script.js ~ line 146 ~ findNearestFreeLift ~ prevDiff", prevDiff)
  let nearestAvailableLift = -1;

  for (let i = 0; i < currLiftPositionArr.length; i++) {
    if (allLiftInfo[i].inMotion === false) {
      const currDiff = Math.abs(currLiftPositionArr[i] - flrNo);
      if (currDiff < prevDiff) {
        prevDiff = currDiff;
        nearestAvailableLift = i;
        // console.log("🚀 ~ file: script.js ~ line 154 ~ findNearestFreeLift ~ nearestAvailableLift", nearestAvailableLift)
      }
    }
  }

  return nearestAvailableLift;
}

const generateLifts = (n) => {
  allLiftInfo = [];
  for (let i = 0; i < n; i++) {
    let liftNo = `Lift-${i}`;
    const currLift = document.createElement("div");
    currLift.setAttribute("id", liftNo);
    currLift.classList.add("lifts");
    currLift.innerHTML = `
           
            <div class="gate gateLeft" id="L${i}left_gate"></div>
            <div class="gate gateRight" id="L${i}right_gate"></div>
        `;
    currLift.style.left = `${(i + 1) * 90}px`;
    currLift.style.top = "0px";
    document.getElementById("Level-0").appendChild(currLift);
    currLiftPositionArr[i] = 0;

    const currLiftDetail = {};
    currLiftDetail.id = liftNo;
    currLiftDetail.inMotion = false;
    allLiftInfo.push(currLiftDetail);
  }
};

function fullFillLiftCallsQueue() {
  if (!liftCallsQueue.length) return;
  let targetFlr = liftCallsQueue[0];

  const liftToMove = findNearestFreeLift(targetFlr);
  if (liftToMove != -1) {
    translateLift(liftToMove, targetFlr);
    liftCallsQueue.shift();
  }
}
