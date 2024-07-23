const userInput = document.querySelector('article.user-input');
const form = userInput.querySelector('form');
const inputTable = form.querySelector('table');
const tbody = inputTable.querySelector('tbody');
const simulation = document.querySelector('article.simulation');
const timeUnitTable = simulation.querySelector('.timeUnitTable');
const memory = simulation.querySelector('aside');
const flow = simulation.querySelector('.bottom section');
let given = {
  memorySize: 0,
  algorithm: '',
  jobs: [],
  timeCompaction: 0,
  coalescingHole: 0,
}
let largestTU = 0;
let jobsInMemory;
function addRow(){
  const jobNumber = tbody.children.length + 1;

  tbody.innerHTML += 
  `<tr>
    <td>${jobNumber}</td>
    <td>
      <input type="number" name="size${jobNumber}" id="size${jobNumber}" min="10" required>
    </td>
    <td>
      <input type="number" name="timeUnit${jobNumber}" id="timeUnit${jobNumber}" min="1" required>
    </td>
  </tr>`;
}
form.addEventListener('submit', e => {
  e.preventDefault();

  const memorySize = form.querySelector('#memorySize').value;
  const algorithm = form.querySelector('#algorithm').value;
  const timeCompaction = form.querySelector('#timeCompaction').value;
  const coalescingHole = form.querySelector('#coalescingHole').value;
  const TRs = tbody.children;

  given.jobs = [];

  for(let i = 0; i < TRs.length; i++){
    const sizeVal = parseInt(TRs[i].querySelector(`#size${i + 1}`).value);
    const timeUnitVal = parseInt(TRs[i].querySelector(`#timeUnit${i + 1}`).value);

    given.jobs.push({
      number: i + 1,
      size: sizeVal,
      timeUnit: timeUnitVal,
      timeUnitLeft: timeUnitVal,
      allocated: false,
      done: false,
    });
    if(largestTU < timeUnitVal){
      largestTU = timeUnitVal;
    }
  }

  given.memorySize = parseInt(memorySize);
  given.timeCompaction = parseInt(timeCompaction);
  given.coalescingHole = parseInt(coalescingHole);
  given.algorithm = algorithm;

  startSimulation();
});

async function startSimulation(){
  generateContent();

  while(totalTimeUnitsLeft() > 0){
    updateJobsInMemory();

    switch(given.algorithm){
      case 'First Fit':
        await firstFitAlgorithm();
        break;
      case 'Best Fit':
        await bestFitAlgorithm();
        break;
      case 'Worst Fit':
        await worstFitAlgorithm();
        break;
    }
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const totalTimeUnitsLeft = () => given.jobs.reduce((total, job) => total + job.timeUnitLeft, 0);
function generateContent(){
  userInput.style.display = 'none';
  simulation.style.display = 'block';

  const memorySize = simulation.querySelector('[data-memorySize]');
  const algorithm = simulation.querySelector('[data-algorithm]');
  const timeCoalescing = simulation.querySelector('[data-timeCoalescing]');
  const storageCompaction = simulation.querySelector('[data-storageCompaction]');

  memorySize.innerText = given.memorySize;
  algorithm.innerText = given.algorithm;
  timeCoalescing.innerText = given.coalescingHole;
  storageCompaction.innerText = given.timeCompaction;

  let content = `
    <thead>
      <tr>
        <th>Job</th>
        <th>Size(KB)</th>
        <th colspan="${largestTU + 1}">Time Unit</th>
      </tr>
    </thead>
    <tbody>`;
  for(let job of given.jobs){
    content += `
      <tr>
        <td>${job.number}</td>
        <td>${job.size}</td>
        <td>${job.timeUnit}</td>`;
    for(let i = 0; i < largestTU; i++){
      content += `<td class="TU"></td>`;
    }
    content += `</tr>`;
  }
  content += '</tbody>';

  timeUnitTable.innerHTML = content;
  memory.style.gridTemplateRows = `repeat(${given.memorySize}, 1fr)`;
}
function updateJobsInMemory(){
  jobsInMemory = Array.from(memory.querySelectorAll('div'));

  jobsInMemory.sort((a, b) => {
    const RowA = a.style.gridRow.split('/')[0];
    const RowB = b.style.gridRow.split('/')[0];
    return parseInt(RowA) - parseInt(RowB);
  });
  jobsInMemory.forEach(div => memory.appendChild(div));
}

async function firstFitAlgorithm(){
  for(let job of given.jobs){
    const {number, size, allocated, done} = job;

    if(done) continue;

    if(!allocated){
      firstFitAllocate(job);
    }

    updateJobsInMemory();

    if(job.allocated){
      const res = updateContent(job);
      if(res.deallocate){
        await delay(1500);
        await allocatePendingJobs();
      }
      else{
        await delay(1500);
      }
    }
  }
}
function firstFitAllocate(job){
  const {number, size} = job;
  const getBounds = (element) => {
    const bounds = element.style.gridRow.split('/');
    return { start: parseInt(bounds[0]), end: parseInt(bounds[1]) };
  }
  if(jobsInMemory.length === 0 && size <= given.memorySize){
    memory.innerHTML += `<div class="J${number}" style="grid-row: 1/${size};">J${number} - ${size}</div>`;
    job.allocated = true;
  }
  else{
    let start, end;

    for (let i = 0; i <= jobsInMemory.length; i++) {
      if (i === 0) {
        start = 0;
        end = getBounds(jobsInMemory[i]).start;
      } else if (i === jobsInMemory.length) {
        start = getBounds(jobsInMemory[i - 1]).end;
        end = given.memorySize;
      } else {
        start = getBounds(jobsInMemory[i - 1]).end;
        end = getBounds(jobsInMemory[i]).start;
      }
      if (size <= end - start) {
        memory.innerHTML += `<div class="J${number}" style="grid-row: ${(start === 0) ? 1 : start}/${start + size};">J${number} - ${size}</div>`;
        job.allocated = true;
        break;
      }
    }
  }
}
async function bestFitAlgorithm(){

}
function bestFitAllocate(job){

}
async function worstFitAlgorithm(){

}
function worstFitAllocate(job){

}
async function allocatePendingJobs(){
  for (let job of given.jobs) {
    const {allocated, done} = job;

    if(!allocated && !done){
      switch(given.algorithm){
        case 'First Fit':
          firstFitAllocate(job);
          break;
        case 'Best Fit':
          bestFitAllocate(job);
          break;
        case 'Worst Fit':
          worstFitAllocate(job);
          break;
      }

      if(job.allocated){
        updateContent(job);
        await delay(1500);
      }
    }
    updateJobsInMemory();
  }
}

function updateContent(job){
  const {number, size, timeUnit, timeUnitLeft, allocated, done} = job;
  const cell = timeUnitTable.querySelector(`tbody tr:nth-child(${number}) .TU`);
  const obj = {};
  
  cell.classList.remove('TU');
  if(--job.timeUnitLeft === 0){
    cell.innerText = '*';
    job.done = true;

    const jobDiv = memory.querySelector(`.J${number}`);
    if(jobDiv){
      memory.removeChild(jobDiv);
      flow.innerHTML += `<div>J${number}</div>`;
      return {deallocate: true};
    }
  }
  else{
    cell.innerText = job.timeUnitLeft;
  }
  flow.innerHTML += `<div>J${number}</div>`;
  return {deallocate: false};
}