// Utility
const $ = (s, c=document)=>c.querySelector(s);
const $$ = (s, c=document)=>Array.from(c.querySelectorAll(s));

// Nav
const navToggle = $('.nav-toggle'), menu = $('#menu');
navToggle?.addEventListener('click', ()=>{
  const open = menu.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
});

// Year
$('#year').textContent = new Date().getFullYear();

// Slider (max 5)
(function slider(){
  const root = $('.slider'); if(!root) return;
  const track = $('.slider-track', root);
  const slides = $$('.slide', root).slice(0,5);
  const prev = $('.prev', root), next = $('.next', root), dots = $('.dots', root);
  let idx=0, timer=null, interacting=false;
  slides.forEach((_,i)=>{
    const b=document.createElement('button');
    b.setAttribute('aria-label', 'Ke slide ' + (i+1));
    b.addEventListener('click', ()=>go(i));
    dots.appendChild(b);
  });
  function go(i){ idx=(i+slides.length)%slides.length; update(); }
  function update(){
    track.style.transform = `translateX(${-idx*100}%)`;
    $$('.dots button', root).forEach((d,i)=>d.classList.toggle('active', i===idx));
  }
  prev.addEventListener('click', ()=>go(idx-1));
  next.addEventListener('click', ()=>go(idx+1));
  track.addEventListener('keydown', e=>{
    if(e.key==='ArrowLeft') go(idx-1);
    if(e.key==='ArrowRight') go(idx+1);
  });
  let x0=null;
  track.addEventListener('pointerdown', e=>{ x0=e.clientX; interacting=true; });
  track.addEventListener('pointerup', e=>{
    if(x0===null) return;
    const dx=e.clientX-x0; if(Math.abs(dx)>40) go(idx+(dx<0?1:-1)); x0=null; interacting=false;
  });
  const autoplay=root.dataset.autoplay==='true'; const interval=parseInt(root.dataset.interval||'4200',10);
  function start(){ if(!autoplay) return; stop(); timer=setInterval(()=>!interacting&&go(idx+1), interval); }
  function stop(){ if(timer) clearInterval(timer); }
  const io=new IntersectionObserver(entries=>entries.forEach(en=>en.isIntersecting?start():stop()),{threshold:.2});
  io.observe(root);
  update();
})();

// Currency formatter (IDR)
const fmt = new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 });

// CART
const cartState = {
  items: JSON.parse(localStorage.getItem('cart.items')||'[]')
};

function saveCart(){ localStorage.setItem('cart.items', JSON.stringify(cartState.items)); refreshCartUI(); }
function addToCart(id, name, price, qty=1){
  const found = cartState.items.find(i=>i.id===id);
  if(found) found.qty += qty;
  else cartState.items.push({ id, name, price, qty });
  saveCart();
}
function updateQty(id, delta){
  const it = cartState.items.find(i=>i.id===id); if(!it) return;
  it.qty += delta;
  if(it.qty<=0) cartState.items = cartState.items.filter(i=>i.id!==id);
  saveCart();
}
function cartTotal(){ return cartState.items.reduce((s,i)=>s + i.price*i.qty, 0); }

// Bind Add to Cart + Checkout on slides
$$('.slide').forEach(slide=>{
  slide.querySelector('.add-to-cart').addEventListener('click', ()=>{
    addToCart(slide.dataset.id, slide.dataset.name, parseInt(slide.dataset.price,10), 1);
  });
  slide.querySelector('.checkout-now').addEventListener('click', ()=>{
    addToCart(slide.dataset.id, slide.dataset.name, parseInt(slide.dataset.price,10), 1);
    openCart();
  });
});

// Cart UI
const cart = $('#cart');
const itemsEl = $('#cart-items');
const totalEl = $('#cart-total');
const countEls = [$('#cart-count'), $('#cart-count-2')];
function refreshCartUI(){
  // counts
  const count = cartState.items.reduce((s,i)=>s+i.qty,0);
  countEls.forEach(el=> el && (el.textContent = count));
  // items
  itemsEl.innerHTML = '';
  cartState.items.forEach(i=>{
    const li = document.createElement('li');
    li.className='cart-item';
    li.innerHTML = `
      <div class="name">${i.name}<div class="muted">${fmt.format(i.price)} x ${i.qty}</div></div>
      <div class="subtotal"><strong>${fmt.format(i.price*i.qty)}</strong></div>
      <div class="qty">
        <button aria-label="Kurangi">−</button>
        <span>${i.qty}</span>
        <button aria-label="Tambah">+</button>
      </div>`;
    const [minusBtn,, plusBtn] = $$('button', li);
    minusBtn.addEventListener('click', ()=>updateQty(i.id, -1));
    plusBtn.addEventListener('click', ()=>updateQty(i.id, +1));
    itemsEl.appendChild(li);
  });
  totalEl.textContent = fmt.format(cartTotal());
}
refreshCartUI();

// Cart open/close
function openCart(){ cart.setAttribute('aria-hidden','false'); }
function closeCart(){ cart.setAttribute('aria-hidden','true'); }
$$('.cart-open').forEach(b=> b.addEventListener('click', openCart));
$$('.cart-close').forEach(b=> b.addEventListener('click', closeCart));

// Checkout via WhatsApp
const WA_NUMBER = '6281234567890'; // ganti ke nomor WhatsApp bisnis kamu (tanpa +)
$('#checkout').addEventListener('click', ()=>{
  if(cartState.items.length===0){ alert('Keranjang masih kosong'); return; }
  const ci = $('#ci').value, co = $('#co').value, guests = $('#guests').value || '2';
  const lines = [
    '*The Hideaway — Permintaan Pemesanan*',
    '',
    '*Pesanan:*',
    ...cartState.items.map(i=>`• ${i.name} — ${i.qty} malam — ${fmt.format(i.price)} / malam`),
    '',
    `*Total Perkiraan:* ${fmt.format(cartTotal())}`,
    '',
    '*Detail Tamu:*',
    `Check-in: ${ci || '-'}`,
    `Check-out: ${co || '-'}`,
    `Jumlah Tamu: ${guests}`,
    '',
    'Mohon konfirmasi ketersediaan & metode pembayaran. Terima kasih.'
  ];
  const msg = encodeURIComponent(lines.join('\n'));
  const url = `https://wa.me/${WA_NUMBER}?text=${msg}`;
  window.open(url, '_blank');
});

// Testimonials (persist to localStorage)
const testiKey = 'thehideaway.testimonials';
const testiDefault = JSON.parse(localStorage.getItem(testiKey) || '[]');
const testiList = $('#testi-list');
function addTestiToUI({name, city, message}){
  const li = document.createElement('li'); li.className='testi-item';
  li.innerHTML = `<blockquote>“${message}”</blockquote><div class="meta">— ${name}, ${city}</div>`;
  testiList.appendChild(li);
}
testiDefault.forEach(addTestiToUI);

$('#testi-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.currentTarget));
  const t = {name:data.name.trim(), city:data.city.trim(), message:data.message.trim()};
  if(!t.name || !t.city || !t.message) return;
  const all = JSON.parse(localStorage.getItem(testiKey) || '[]');
  all.push(t); localStorage.setItem(testiKey, JSON.stringify(all));
  addTestiToUI(t);
  $('#testi-note').textContent = 'Terima kasih! Testimonimu sudah ditambahkan.';
  e.currentTarget.reset();
});

// Feedback (Kritik & Saran) — kirim ke WhatsApp juga (opsional)
$('#feedback-form').addEventListener('submit', (e)=>{
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.currentTarget));
  $('#fb-note').textContent = 'Terima kasih! Masukanmu sudah kami terima.';
  // Jika ingin ke WhatsApp juga, uncomment di bawah:
  // const msg = encodeURIComponent(`Kritik & Saran\nNama: ${d.name||'-'}\nEmail: ${d.email||'-'}\nKategori: ${d.category}\nPesan: ${d.message}`);
  // window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank');
});
