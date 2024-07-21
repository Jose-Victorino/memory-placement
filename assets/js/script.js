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
    for(job of given.jobs){
      const {number, size, timeUnit, timeUnitLeft, allocated, done} = job;
      
      if(done) continue;
      
      if(!allocated){
        switch(given.algorithm){
          case 'First Fit':
            firstFitAlgorithm(job);
            break;
          case 'Best Fit':
            bestFitAlgorithm(job);
            break;
          case 'Worst Fit':
            worstFitAlgorithm(job);
            break;
        }
      }

      if(job.allocated){
        await delay(1500);
        updateContent(job);
      }
    }
  }
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
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
  for(job of given.jobs){
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
function totalTimeUnitsLeft(){
  return given.jobs.reduce((total, job) => total + job.timeUnitLeft, 0);
}
function firstFitAlgorithm(job){
  const { number, size } = job;

  function getBounds(element){
    const bounds = element.style.gridRow.split('/');
    return { start: parseInt(bounds[0]), end: parseInt(bounds[1]) };
  }
  function placeJob(start){
    memory.innerHTML += `<div class="J${number}" style="grid-row: ${(start === 0) ? 1 : start}/${start + size};">J${number} - ${size}</div>`;
    job.allocated = true;
  }

  const jobsInMemory = Array.from(memory.querySelectorAll('div'));

  jobsInMemory.sort((a, b) => {
    const RowA = a.style.gridRow.split('/')[0];
    const RowB = b.style.gridRow.split('/')[0];
    return parseInt(RowA) - parseInt(RowB);
  });
  jobsInMemory.forEach(div => memory.appendChild(div));

  if(jobsInMemory.length === 0 && size <= given.memorySize){
    placeJob(0);
  }
  else{
    for(let i = 0; i <= jobsInMemory.length; i++){
      let start, end;

      if(i === 0){
        start = 0;
        end = getBounds(jobsInMemory[i]).start;
      }
      else if(i === jobsInMemory.length){
        start = getBounds(jobsInMemory[i - 1]).end;
        end = given.memorySize;
      }
      else{
        start = getBounds(jobsInMemory[i - 1]).end;
        end = getBounds(jobsInMemory[i]).start;
      }
      if(size <= end - start){
        placeJob(start);
        break;
      }
    }
  }
}
function bestFitAlgorithm(){

}
function worstFitAlgorithm(){

}

function updateContent(job){
  const {number, size, timeUnit, timeUnitLeft, allocated, done} = job;
  const cell = timeUnitTable.querySelector(`tbody tr:nth-child(${number}) .TU`);

  cell.classList.remove('TU');
  if(--job.timeUnitLeft === 0){
    cell.innerText = '*';
    job.done = true;

    const jobDiv = memory.querySelector(`.J${number}`);
    if(jobDiv){
      memory.removeChild(jobDiv);
    }
  }
  else{
    cell.innerText = job.timeUnitLeft;
  }
  flow.innerHTML += `<div>J${number}</div>`;
}