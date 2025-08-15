// Hotel Bintang Lima JS: slider, room list, booking cart (localStorage), check-in and checkout simulation
document.addEventListener('DOMContentLoaded',()=>{

  // Slider
  const slidesEl = document.querySelector('.slides');
  const totalSlides = document.querySelectorAll('.slide').length;
  let idx = 0;
  function go(i){ slidesEl.style.transform = `translateX(${-i*100}%)`; idx = (i+totalSlides)%totalSlides; }
  document.getElementById('prev').onclick = ()=> go(idx-1);
  document.getElementById('next').onclick = ()=> go(idx+1);
  let autoplay = setInterval(()=> go(idx+1), 4500);
  document.getElementById('slider').addEventListener('mouseenter', ()=> clearInterval(autoplay));
  document.getElementById('slider').addEventListener('mouseleave', ()=> autoplay = setInterval(()=> go(idx+1), 4500));

  // Rooms (sample)
  const rooms = [
    {id:1,name:'Kamar Ceria Deluxe',price:750000,img:'assets/room1.svg',desc:'Kamar luas dengan tema bintang & mainan.'},
    {id:2,name:'Suite Pelangi',price:1250000,img:'assets/room2.svg',desc:'Suite mewah dengan area bermain privat.'},
    {id:3,name:'Kamar Mini VIP',price:450000,img:'assets/room3.svg',desc:'Kamar nyaman untuk keluarga kecil.'}
  ];
  const productsEl = document.getElementById('products');
  rooms.forEach(r=>{
    const card = document.createElement('div'); card.className='card';
    card.innerHTML = `
      <div class="thumb" style="background-image:url('${r.img}')"></div>
      <h3>${r.name}</h3>
      <p class="desc">${r.desc}</p>
      <div class="meta">
        <div class="price">Rp${r.price.toLocaleString('id')}</div>
        <button class="btn add" data-id="${r.id}">Pesan</button>
      </div>`;
    productsEl.appendChild(card);
  });

  // Booking cart
  const key = 'hotel_bintang_lima_cart_v1';
  function load(){ try{ return JSON.parse(localStorage.getItem(key))||{} }catch(e){return {}} }
  function save(c){ localStorage.setItem(key, JSON.stringify(c)); render(); }
  function formatIDR(v){ return 'Rp'+v.toLocaleString('id'); }

  function render(){
    const cart = load();
    const itemsEl = document.getElementById('book-items'); itemsEl.innerHTML='';
    let total=0, count=0;
    for(const id in cart){
      const r = rooms.find(x=>x.id==id);
      const qty = cart[id];
      total += r.price * qty;
      count += qty;
      const el = document.createElement('div'); el.className='book-item';
      el.innerHTML = `<div class="bi-thumb" style="background-image:url('${r.img}')"></div>
        <div style="flex:1">
          <div><strong>${r.name}</strong></div>
          <div class="qty"><button class="dec" data-id="${id}">−</button><span style="padding:0 8px">${qty}</span><button class="inc" data-id="${id}">＋</button></div>
        </div>
        <div style="font-weight:800">${formatIDR(r.price*qty)}</div>`;
      itemsEl.appendChild(el);
    }
    document.getElementById('book-total').textContent = formatIDR(total);
    document.getElementById('book-count').textContent = count;
  }

  document.body.addEventListener('click',(e)=>{
    if(e.target.matches('.add')){
      const id = e.target.dataset.id; const c = load(); c[id] = (c[id]||0)+1; save(c);
    } else if(e.target.matches('.inc')||e.target.matches('.dec')){
      const id = e.target.dataset.id; const c = load();
      if(e.target.matches('.inc')) c[id] = (c[id]||0)+1;
      else { c[id] = (c[id]||0)-1; if(c[id]<=0) delete c[id]; }
      save(c);
    }
  });

  // Open/close booking panel
  const panel = document.getElementById('book-panel');
  document.getElementById('open-book').onclick = ()=> panel.classList.toggle('hidden');
  document.getElementById('close-book').onclick = ()=> panel.classList.add('hidden');

  // Check-in quick form (just a friendly simulation)
  document.getElementById('checkin-form').onsubmit = (ev)=>{
    ev.preventDefault();
    alert('Cek ketersediaan selesai (simulasi). Kamu bisa menambahkan kamar ke reservasi lewat tombol "Pesan".');
  };

  // Checkout
  document.getElementById('checkout-btn').onclick = ()=> {
    const cart = load(); if(Object.keys(cart).length===0){ alert('Reservasimu kosong!'); return; }
    const summary = document.getElementById('checkout-summary'); summary.innerHTML='';
    let total=0;
    for(const id in cart){
      const r = rooms.find(x=>x.id==id); const qty = cart[id];
      total += r.price*qty;
      const div = document.createElement('div'); div.textContent = `${r.name} × ${qty} — ${formatIDR(r.price*qty)}`; summary.appendChild(div);
    }
    const t = document.createElement('div'); t.style.fontWeight='900'; t.style.marginTop='10px'; t.textContent = 'Total: '+formatIDR(total); summary.appendChild(t);
    document.getElementById('checkout-modal').classList.remove('hidden');
  };
  document.getElementById('close-checkout').onclick = ()=> document.getElementById('checkout-modal').classList.add('hidden');

  document.getElementById('checkout-form').onsubmit = (ev)=>{
    ev.preventDefault();
    const name = document.getElementById('cust-name').value;
    localStorage.removeItem(key);
    render();
    document.getElementById('checkout-modal').classList.add('hidden');
    document.getElementById('book-panel').classList.add('hidden');
    alert('Terima kasih '+name+'! Reservasimu telah diterima (simulasi).');
  };

  // init
  render();
  document.getElementById('year').textContent = new Date().getFullYear();
});
