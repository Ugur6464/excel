const form = document.getElementById('tradeForm');
const toggleDark = document.getElementById('toggleDark');
const exportButtons = document.querySelectorAll('.export');

toggleDark.addEventListener('click', () => document.body.classList.toggle('dark'));

// Modal
const contactBtn = document.getElementById('contactBtn');
const contactModal = document.getElementById('contactModal');
const closeModal = document.querySelector('.modal .close');

contactBtn.addEventListener('click', () => contactModal.style.display = 'block');
closeModal.addEventListener('click', () => contactModal.style.display = 'none');
window.addEventListener('click', (e) => { if(e.target === contactModal) contactModal.style.display = 'none'; });

let forexTrades = JSON.parse(localStorage.getItem('forexTrades')) || [];
let cryptoTrades = JSON.parse(localStorage.getItem('cryptoTrades')) || [];

const balanceInput = document.getElementById('balance');
const leverageInput = document.getElementById('leverage');
const entryInput = document.getElementById('entry');
const amountInput = document.getElementById('amount');
const lotInfo = document.querySelector('.lot-info');

const winMessages = [
  "Her zafer, küçük bir adımla başlar. Tebrikler!",
  "Disiplinin ve sabrın meyvesini verdi.",
  "Her kazanç, doğru stratejinin bir kanıtıdır.",
  "Başarı, cesur olanların yanındadır.",
  "Bugün attığın adım, yarının farkını yaratacak."
];

const loseMessages = [
  "Her kayıp, öğrenmenin bir yoludur; pes etme.",
  "Zorluklar, gerçek gücünü keşfetmendir.",
  "Kaybetmek, yeniden başlamayı öğrenmektir.",
  "Hata yapmak, büyümenin bir parçasıdır.",
  "Bir adım geri, iki adım ileri için fırsattır."
];

function calculateLot() {
  const balance = parseFloat(balanceInput.value);
  const leverage = parseFloat(leverageInput.value);
  const entry = parseFloat(entryInput.value);
  if(balance && leverage && entry) {
    const lot = (balance * leverage) / entry;
    amountInput.value = lot.toFixed(6);
    if(lot < 1) {
      lotInfo.textContent = `⚠️ Bu işlem 1 lot değil, küçük pozisyon.`;
      lotInfo.style.color = 'orange';
    } else {
      lotInfo.textContent = `💡 Bakiye ve kaldıraç ile hesaplanan miktar bu pozisyonu açmak için yeterlidir.`;
      lotInfo.style.color = '#888';
    }
  }
}

function getRandomMessage(profit){
  if(profit >= 0){
    return winMessages[Math.floor(Math.random()*winMessages.length)];
  } else {
    return loseMessages[Math.floor(Math.random()*loseMessages.length)];
  }
}

balanceInput.addEventListener('input', calculateLot);
leverageInput.addEventListener('input', calculateLot);
entryInput.addEventListener('input', calculateLot);

form.addEventListener('submit', e => {
  e.preventDefault();
  const trade = {
    date: document.getElementById('date').value || '',
    name: document.getElementById('trade').value || '',
    direction: document.getElementById('direction').value,
    entry: parseFloat(entryInput.value),
    stop: parseFloat(document.getElementById('stop').value),
    target: parseFloat(document.getElementById('target').value),
    exit: parseFloat(document.getElementById('exit').value) || null,
    amount: parseFloat(amountInput.value) || 0,
    leverage: parseFloat(leverageInput.value) || 1,
    desc: document.getElementById('desc').value || '',
    link: document.getElementById('link').value || ''
  };

  const exitPrice = trade.exit || trade.target;
  let profit;
  if(trade.direction==='long') profit = (exitPrice - trade.entry) * trade.amount;
  else profit = (trade.entry - exitPrice) * trade.amount;
  trade.profit = profit.toFixed(2);
  trade.message = getRandomMessage(profit);

  const category = document.getElementById('category').value;
  if(category==='forex') { forexTrades.push(trade); localStorage.setItem('forexTrades', JSON.stringify(forexTrades)); }
  else if(category==='crypto') { cryptoTrades.push(trade); localStorage.setItem('cryptoTrades', JSON.stringify(cryptoTrades)); }

  form.reset(); renderTables();
});

function renderTables() {
  renderTable('forex', forexTrades);
  renderTable('crypto', cryptoTrades);
}

function renderTable(category, trades) {
  const tbody = document.getElementById(category+'Table').querySelector('tbody');
  tbody.innerHTML = '';
  trades.forEach((trade, index) => {
    const tr = document.createElement('tr');
    const directionSymbol = trade.direction==='long'?'🟢 Long':'🔴 Short';
    tr.innerHTML = `
      <td>${trade.date}</td>
      <td>${trade.name}</td>
      <td>${directionSymbol}</td>
      <td>${trade.entry}</td>
      <td>${trade.stop}</td>
      <td>${trade.target}</td>
      <td>${trade.amount}</td>
      <td>${trade.leverage}</td>
      <td style="color:${trade.profit>=0?'green':'red'}">${trade.profit}</td>
      <td><span class="trade-message">${trade.message}</span></td>
      <td>${trade.desc}</td>
      <td>${trade.link?`<div class="chart-box" onclick="window.open('${trade.link}','_blank')">TradingView Grafik</div>`:''}</td>
      <td><button class="delete-btn" onclick="deleteTrade('${category}', ${index})">Sil</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function deleteTrade(category, index) {
  if(category==='forex') {
    forexTrades.splice(index,1);
    localStorage.setItem('forexTrades', JSON.stringify(forexTrades));
  } else {
    cryptoTrades.splice(index,1);
    localStorage.setItem('cryptoTrades', JSON.stringify(cryptoTrades));
  }
  renderTables();
}

exportButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.dataset.category;
    const trades = category==='forex'?forexTrades:cryptoTrades;
    if(trades.length===0) return;
    const ws = XLSX.utils.json_to_sheet(trades);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, category);
    XLSX.writeFile(wb, `${category}-trades.xlsx`);
  });
});

renderTables();
