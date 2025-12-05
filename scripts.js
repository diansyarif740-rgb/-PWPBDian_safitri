
// scripts.js — handles buy buttons, cart, order modal and smooth scroll

// ===== HERO SLIDER =====
let heroImages = [
  '74cb4ec4e293d21bb47657f30ff72540.jpg',
  'Berbagai_jenis_songket.jpg',
  'b8390fcb3a3542809efc2a72b91381b5~tplv-aphluv4xwc-resize-webp_800_800.webp',
  'KUNIMG-1024x1024.jpg',
  'mm.jpg'
];

let currentHeroIndex = 0;
let heroAutoPlayInterval = null;

function changeHeroImage(src) {
  const heroImage = document.getElementById('heroImage');
  if (heroImage) {
    heroImage.src = src;
    currentHeroIndex = heroImages.indexOf(src);
    updateHeroThumbnails();
    resetAutoPlay();
  }
}

function nextHeroImage() {
  currentHeroIndex = (currentHeroIndex + 1) % heroImages.length;
  const heroImage = document.getElementById('heroImage');
  if (heroImage) {
    heroImage.src = heroImages[currentHeroIndex];
    updateHeroThumbnails();
    resetAutoPlay();
  }
}

function prevHeroImage() {
  currentHeroIndex = (currentHeroIndex - 1 + heroImages.length) % heroImages.length;
  const heroImage = document.getElementById('heroImage');
  if (heroImage) {
    heroImage.src = heroImages[currentHeroIndex];
    updateHeroThumbnails();
    resetAutoPlay();
  }
}

function updateHeroThumbnails() {
  const thumbnails = document.querySelectorAll('.thumbnail');
  thumbnails.forEach((thumb, idx) => {
    if (idx === currentHeroIndex) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

// Auto-play slider setiap 4 detik
function startHeroAutoPlay() {
  heroAutoPlayInterval = setInterval(nextHeroImage, 4000);
}

// Reset timer auto-play ketika user interaksi
function resetAutoPlay() {
  if (heroAutoPlayInterval) clearInterval(heroAutoPlayInterval);
  startHeroAutoPlay();
}

document.addEventListener('DOMContentLoaded', function () {
  // Mulai auto-play
  startHeroAutoPlay();
  
  // Hero slider buttons
  const heroPrev = document.getElementById('heroPrev');
  const heroNext = document.getElementById('heroNext');
  
  if (heroPrev) heroPrev.addEventListener('click', prevHeroImage);
  if (heroNext) heroNext.addEventListener('click', nextHeroImage);
  
  // ===== MOBILE MENU TOGGLE =====
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        navMenu.classList.remove('active');
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!event.target.closest('nav') && !event.target.closest('.menu-toggle')) {
        navMenu.classList.remove('active');
      }
    });
  }

  // --- Cart state and helpers ---
  let cart = JSON.parse(localStorage.getItem('kain_cart') || '[]');

  function saveCart() {
    localStorage.setItem('kain_cart', JSON.stringify(cart));
    updateCartCount();
  }

  function updateCartCount() {
    const countEl = document.getElementById('cartCount');
    const totalQty = cart.reduce((s, it) => s + it.qty, 0);
    if (countEl) countEl.textContent = totalQty;
  }

  function parsePriceNumber(priceText) {
    if (!priceText) return 0;
    // remove non digits
    const digits = priceText.replace(/[^0-9]/g, '');
    return digits ? Number(digits) : 0;
  }

  function addToCart(product, priceText) {
    const price = parsePriceNumber(priceText);
    const existing = cart.find(i => i.product === product && i.price === price);
    if (existing) existing.qty += 1; else cart.push({ product, price, priceText, qty: 1 });
    saveCart();
    // small feedback
    showTempMessage('Ditambahkan ke keranjang');
    renderCart();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    renderCart();
  }

  function setQty(index, qty) {
    if (qty < 1) return removeFromCart(index);
    cart[index].qty = qty;
    saveCart();
    renderCart();
  }

  // --- Small transient message ---
  function showTempMessage(text) {
    let el = document.getElementById('tempMsg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tempMsg';
      el.style.position = 'fixed';
      el.style.right = '16px';
      el.style.bottom = '16px';
      el.style.background = '#333';
      el.style.color = 'white';
      el.style.padding = '10px 14px';
      el.style.borderRadius = '8px';
      el.style.zIndex = 2000;
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => { el.style.transition = 'opacity 400ms'; el.style.opacity = '0'; }, 900);
  }

  // --- Cart modal rendering ---
  let cartBackdrop = null;

  function ensureCartModal() {
    if (cartBackdrop) return cartBackdrop;
    cartBackdrop = document.createElement('div');
    cartBackdrop.className = 'cart-backdrop';
    cartBackdrop.innerHTML = `
      <div class="cart-modal" role="dialog" aria-modal="true" aria-label="Keranjang">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
          <h3>Keranjang Anda</h3>
          <button class="btn-close-cart" aria-label="Tutup">✕</button>
        </div>
        <div class="cart-items" id="cartItems"></div>
        <div class="cart-total"><span>Total</span><span id="cartTotal">Rp 0</span></div>
        <div class="cart-actions">
          <button class="btn cancel close-cart">Tutup</button>
          <button class="checkout-btn" id="checkoutBtn">Checkout</button>
        </div>
      </div>
    `;
    document.body.appendChild(cartBackdrop);
    cartBackdrop.querySelector('.btn-close-cart').addEventListener('click', closeCart);
    cartBackdrop.querySelector('.close-cart').addEventListener('click', closeCart);
    // checkout button: show payment modal with cart items
    cartBackdrop.querySelector('#checkoutBtn').addEventListener('click', function () {
      if (!cart || cart.length === 0) return;
      
      // Tutup modal keranjang
      closeCart();
      
      // Tampilkan form checkout untuk data customer
      showCheckoutForm();
    });
    return cartBackdrop;
  }

  function renderCart() {
    const backdrop = ensureCartModal();
    const itemsEl = backdrop.querySelector('#cartItems');
    itemsEl.innerHTML = '';
    if (cart.length === 0) {
      itemsEl.innerHTML = '<div class="cart-empty">Keranjang kosong</div>';
      backdrop.querySelector('#cartTotal').textContent = 'Rp 0';
      const checkoutBtn = backdrop.querySelector('#checkoutBtn');
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = '0.6';
      checkoutBtn.style.cursor = 'not-allowed';
      return;
    }
    cart.forEach((it, idx) => {
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <div class="meta">
          <h4>${escapeHtml(it.product)}</h4>
          <div class="price">Rp ${numberWithDots(it.price)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="qty-controls">
            <button data-idx="${idx}" class="qty-decrease">-</button>
            <div style="min-width:28px;text-align:center">${it.qty}</div>
            <button data-idx="${idx}" class="qty-increase">+</button>
          </div>
          <button data-idx="${idx}" class="btn-remove">Hapus</button>
        </div>
      `;
      itemsEl.appendChild(item);
    });
    // attach handlers
    itemsEl.querySelectorAll('.qty-increase').forEach(b => b.addEventListener('click', function () { const i=Number(this.dataset.idx); setQty(i, cart[i].qty+1); }));
    itemsEl.querySelectorAll('.qty-decrease').forEach(b => b.addEventListener('click', function () { const i=Number(this.dataset.idx); setQty(i, cart[i].qty-1); }));
    itemsEl.querySelectorAll('.btn-remove').forEach(b => b.addEventListener('click', function () { const i=Number(this.dataset.idx); removeFromCart(i); }));

    const total = cart.reduce((s, it) => s + (it.qty * it.price), 0);
    backdrop.querySelector('#cartTotal').textContent = 'Rp ' + numberWithDots(total);
    
    // Pastikan tombol checkout aktif dan terlihat jelas
    const checkoutBtn = backdrop.querySelector('#checkoutBtn');
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = '1';
    checkoutBtn.style.cursor = 'pointer';
  }

  function showCart() { ensureCartModal(); renderCart(); cartBackdrop.classList.add('open'); cartBackdrop.style.display = 'flex'; }
  function closeCart() { if (!cartBackdrop) return; cartBackdrop.classList.remove('open'); cartBackdrop.style.display = 'none'; }

  // --- Checkout Form Modal ---
  let checkoutFormBackdrop = null;
  
  function showCheckoutForm() {
    if (!cart || cart.length === 0) return;
    
    // Buat modal form checkout jika belum ada
    if (!checkoutFormBackdrop) {
      checkoutFormBackdrop = document.createElement('div');
      checkoutFormBackdrop.className = 'modal-backdrop';
      checkoutFormBackdrop.innerHTML = `
        <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <div class="modal-header">
            <h3 id="checkout-title">Form Checkout</h3>
            <button type="button" aria-label="Tutup" class="btn-close">✕</button>
          </div>
          <div class="modal-body">
            <div style="margin-bottom: 16px; padding: 12px; background: #f5efe6; border-radius: 8px;">
              <strong>Total Belanja:</strong> <span id="checkout-total-preview">Rp 0</span>
            </div>
            <label for="checkout-name">Nama *</label>
            <input id="checkout-name" name="checkout-name" type="text" placeholder="Nama Anda" required />
            <label for="checkout-email">Email *</label>
            <input id="checkout-email" name="checkout-email" type="email" placeholder="Email untuk konfirmasi" required />
            <label for="checkout-phone">No. Telepon *</label>
            <input id="checkout-phone" name="checkout-phone" type="text" placeholder="Nomor telepon/WA" required />
            <label for="checkout-address">Alamat</label>
            <textarea id="checkout-address" name="checkout-address" rows="2" placeholder="Alamat pengiriman (opsional)"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn cancel" id="checkout-cancel">Batal</button>
            <button type="button" class="btn confirm" id="checkout-submit">Lanjutkan Pembayaran</button>
          </div>
        </div>
      `;
      document.body.appendChild(checkoutFormBackdrop);
      
      // Event listeners
      checkoutFormBackdrop.querySelector('.btn-close').addEventListener('click', closeCheckoutForm);
      checkoutFormBackdrop.querySelector('#checkout-cancel').addEventListener('click', closeCheckoutForm);
      checkoutFormBackdrop.addEventListener('click', function(e) {
        if (e.target === checkoutFormBackdrop) closeCheckoutForm();
      });
      
      checkoutFormBackdrop.querySelector('#checkout-submit').addEventListener('click', function() {
        const name = checkoutFormBackdrop.querySelector('#checkout-name').value.trim();
        const email = checkoutFormBackdrop.querySelector('#checkout-email').value.trim();
        const phone = checkoutFormBackdrop.querySelector('#checkout-phone').value.trim();
        const address = checkoutFormBackdrop.querySelector('#checkout-address').value.trim();
        
        if (!name || !email || !phone) {
          alert('Mohon lengkapi nama, email, dan nomor telepon!');
          return;
        }
        
        // Tutup form checkout
        closeCheckoutForm();
        
        // Tampilkan modal pembayaran dengan semua item keranjang
        showCartPaymentModal({
          name: name,
          email: email,
          phone: phone,
          address: address || '-'
        });
      });
    }
    
    // Update total preview
    const total = cart.reduce((s, it) => s + (it.qty * it.price), 0);
    checkoutFormBackdrop.querySelector('#checkout-total-preview').textContent = 'Rp ' + numberWithDots(total);
    
    // Reset form
    checkoutFormBackdrop.querySelector('#checkout-name').value = '';
    checkoutFormBackdrop.querySelector('#checkout-email').value = '';
    checkoutFormBackdrop.querySelector('#checkout-phone').value = '';
    checkoutFormBackdrop.querySelector('#checkout-address').value = '';
    
    // Tampilkan modal
    checkoutFormBackdrop.classList.add('open');
    checkoutFormBackdrop.style.display = 'flex';
    setTimeout(() => checkoutFormBackdrop.querySelector('#checkout-name').focus(), 120);
  }
  
  function closeCheckoutForm() {
    if (!checkoutFormBackdrop) return;
    checkoutFormBackdrop.classList.remove('open');
    checkoutFormBackdrop.style.display = 'none';
  }
  
  function showCartPaymentModal(customerData) {
    if (!paymentModal || !cart || cart.length === 0) return;
    
    // Buat daftar produk dari keranjang
    let productsList = '';
    cart.forEach((it, idx) => {
      productsList += `${it.product} x${it.qty} (Rp ${numberWithDots(it.price)} per item)`;
      if (idx < cart.length - 1) productsList += ', ';
    });
    
    const total = cart.reduce((s, it) => s + (it.qty * it.price), 0);
    
    // Isi data ke modal
    document.getElementById('payment-product').textContent = productsList || '-';
    document.getElementById('payment-price').textContent = 'Rp ' + numberWithDots(total);
    document.getElementById('payment-name').textContent = customerData.name || '-';
    document.getElementById('payment-email').textContent = customerData.email || '-';
    document.getElementById('payment-phone').textContent = customerData.phone || '-';
    document.getElementById('payment-address').textContent = customerData.address || '-';
    document.getElementById('payment-total').textContent = 'Rp ' + numberWithDots(total);
    
    // Tampilkan modal
    paymentModal.classList.add('open');
    paymentModal.style.display = 'flex';
    
    // Kosongkan keranjang setelah checkout
    cart = [];
    saveCart();
  }

  function numberWithDots(x) { return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function escapeHtml(str){ return String(str).replace(/[&<>\"]/g, function(m){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]; }); }

  // wire header cart button
  const headerCartBtn = document.getElementById('cartButton');
  if (headerCartBtn) headerCartBtn.addEventListener('click', function () { showCart(); });

  // --- Create Buy + Cart buttons per product ---
  function createBuyButtons() {
    document.querySelectorAll('.kain-item').forEach(function (item) {
      // avoid duplicating
      if (item.querySelector('.buy-btn')) return;
      const name = item.querySelector('h3') ? item.querySelector('h3').textContent.trim() : 'Produk Tenun';
      const priceEl = item.querySelector('.price');
      const price = priceEl ? priceEl.textContent.trim() : '';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'buy-btn';
      btn.textContent = 'Beli';
      btn.dataset.product = name;
      btn.dataset.price = price;

      const cartIconBtn = document.createElement('button');
      cartIconBtn.type = 'button';
      cartIconBtn.className = 'add-cart';
      cartIconBtn.title = 'Tambah ke Keranjang';
      cartIconBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 4h-2l-1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.11.89 2 2 2h9v-2h-9l1.1-2h6.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21.82 6H6.21L5.27 4H3V2h4v2z" fill="#fff"/></svg>`;
      cartIconBtn.dataset.product = name;
      cartIconBtn.dataset.price = price;

      // append to card-footer, if exists, otherwise to item
      const footer = item.querySelector('.card-footer') || item;
      // prepare container for controls (class applied later)
      const right = document.createElement('div');
      // append cart icon first (left), then buy button (right)
      right.appendChild(cartIconBtn);
      right.appendChild(btn);

      // move price into a styled price box placed above the controls
      const priceNode = footer.querySelector('.price');
      footer.innerHTML = '';
      const priceTableWrapper = document.createElement('div');
      priceTableWrapper.className = 'price-table';

      const box = document.createElement('div');
      box.className = 'price-box';
      const amount = document.createElement('div');
      amount.className = 'price-amount';
      if (priceNode) {
        // move existing price span into amount container
        priceNode.classList.add('price-inline');
        amount.appendChild(priceNode);
      } else {
        amount.textContent = price;
      }
      box.appendChild(amount);
      priceTableWrapper.appendChild(box);

      // give the controls container a class so CSS can align buttons horizontally
      right.className = 'controls';
      footer.appendChild(priceTableWrapper);
      footer.appendChild(right);

      btn.addEventListener('click', function () {
        openOrderModal(this.dataset.product, this.dataset.price);
      });
      cartIconBtn.addEventListener('click', function () {
        addToCart(this.dataset.product, this.dataset.price);
      });
      // open modal when clicking the card (but ignore clicks on control buttons)
      item.addEventListener('click', function (e) {
        if (e.target.closest('.controls') || e.target.closest('button')) return;
        openOrderModal(name, price);
      });
    });
  }

  // --- order modal (keep existing mailto flow) ---
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-content" role="dialog" aria-modal="true" aria-labelledby="order-title">
      <div class="modal-header">
        <h3 id="order-title">Form Pemesanan</h3>
        <button type="button" aria-label="Tutup" class="btn-close">✕</button>
      </div>
      <div class="modal-body">
        <div><strong>Produk:</strong> <span id="order-product">-</span></div>
        <div><strong>Harga:</strong> <span id="order-price">-</span></div>
        <label for="cust-name">Nama</label>
        <input id="cust-name" name="cust-name" type="text" placeholder="Nama Anda" />
        <label for="cust-email">Email</label>
        <input id="cust-email" name="cust-email" type="email" placeholder="Email untuk konfirmasi" />
        <label for="cust-phone">No. Telepon</label>
        <input id="cust-phone" name="cust-phone" type="text" placeholder="Nomor telepon/WA" />
        <label for="cust-address">Alamat</label>
        <textarea id="cust-address" name="cust-address" rows="2" placeholder="Alamat pengiriman (opsional)"></textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn cancel">Batal</button>
        <button type="button" class="btn add-from-modal">Tambah ke Keranjang</button>
        <button type="button" class="btn confirm">Kirim Pesanan</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);

  // modal controls
  const modal = backdrop;
  function openOrderModal(product, price) {
    modal.querySelector('#order-product').textContent = product;
    modal.querySelector('#order-price').textContent = price;
    modal.classList.add('open');
    backdrop.classList.add('open');
    // focus name field
    setTimeout(() => modal.querySelector('#cust-name').focus(), 120);
  }
  function closeOrderModal() {
    modal.classList.remove('open');
    backdrop.classList.remove('open');
  }

  // click handlers
  modal.addEventListener('click', function (ev) {
    if (ev.target === modal) closeOrderModal();
  });
  modal.querySelector('.btn-close').addEventListener('click', closeOrderModal);
  modal.querySelector('.cancel').addEventListener('click', closeOrderModal);

  // Add to cart directly from modal
  const addFromModalBtn = modal.querySelector('.add-from-modal');
  if (addFromModalBtn) {
    addFromModalBtn.addEventListener('click', function () {
      const product = modal.querySelector('#order-product').textContent.trim();
      const price = modal.querySelector('#order-price').textContent.trim();
      if (product) addToCart(product, price);
      closeOrderModal();
    });
  }

  modal.querySelector('.confirm').addEventListener('click', function () {
    const product = modal.querySelector('#order-product').textContent.trim();
    const price = modal.querySelector('#order-price').textContent.trim();
    const name = modal.querySelector('#cust-name').value.trim();
    const email = modal.querySelector('#cust-email').value.trim();
    const phone = modal.querySelector('#cust-phone').value.trim();
    const address = modal.querySelector('#cust-address').value.trim();

    // Validasi form
    if (!name || !email || !phone) {
      alert('Mohon lengkapi nama, email, dan nomor telepon!');
      return;
    }

    // Tutup modal order
    closeOrderModal();

    // Tampilkan modal pembayaran
    showPaymentModal({
      product: product,
      price: price,
      name: name,
      email: email,
      phone: phone,
      address: address || '-'
    });
  });

  // smooth scrolling for internal anchors
  // internal anchors: if from header nav, show only that section; otherwise smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (!href || href.length <= 1) return;
      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      const isHeaderNav = this.closest('nav') !== null;
      if (isHeaderNav) {
        e.preventDefault();
        showOnlySection(targetId);
        return;
      }
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // create buy buttons then attach
  createBuyButtons();
  updateCartCount();

  // If a hash requests a specific section, show only that
  if (location.hash && location.hash.length > 1) {
    const requested = location.hash.slice(1);
    if (document.getElementById(requested)) showOnlySection(requested);
  }

  // --- Shop preview (combine kain tenun + baju wanita) ---
  function populateShopPreview(filter = 'all') {
    const grid = document.getElementById('shopPreviewGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const sources = [];
    // map filters to section selectors
    const map = {
      'all': ['#kaintenun .kain-item', '#wanita .kain-item', '#pria .kain-item', '#aksesoris .kain-item'],
      'kaintenun': ['#kaintenun .kain-item'],
      'wanita': ['#wanita .kain-item'],
      'pria': ['#pria .kain-item'],
      'aksesoris': ['#aksesoris .kain-item']
    };

    const selectors = map[filter] || map['all'];
    selectors.forEach(sel => document.querySelectorAll(sel).forEach(i => sources.push(i)));

    sources.forEach(src => {
      const clone = src.cloneNode(true);
      // remove any existing buy-buttons (they'll be re-added by createBuyButtons)
      const existingBtns = clone.querySelectorAll('.buy-btn, .add-cart');
      existingBtns.forEach(b => b.remove());
      grid.appendChild(clone);
    });

    // add buy buttons/controls to newly appended clones
    createBuyButtons();
  }

  function showShopPreview(filter = 'all') {
    const preview = document.getElementById('shop-preview');
    if (!preview) return;
    populateShopPreview(filter);
    preview.setAttribute('aria-hidden', 'false');
    preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function hideShopPreview() {
    const preview = document.getElementById('shop-preview');
    if (!preview) return;
    preview.setAttribute('aria-hidden', 'true');
  }

  // wire shop CTA buttons
  const shopBtn = document.getElementById('shopBtn');
  if (shopBtn) shopBtn.addEventListener('click', function () {
    // open the preview without forcing all sections to show
    showShopPreview('all');
    // scroll to preview area
    const preview = document.getElementById('shop-preview');
    if (preview) preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  const closeShop = document.getElementById('closeShopPreview');
  if (closeShop) closeShop.addEventListener('click', function () { hideShopPreview(); });

  // category buttons: set active and scroll to corresponding section
  document.querySelectorAll('.shop-categories .cat-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.shop-categories .cat-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const cat = (this.dataset.cat || 'all');
      // map category to section id
      const map = { all: 'kaintenun', kain: 'kaintenun', kaintenun: 'kaintenun', wanita: 'wanita', pria: 'pria', aksesoris: 'aksesoris' };
      const sectionId = map[cat] || 'kaintenun';
      // show only that section
      showOnlySection(sectionId);
    });
  });

  // Show only a single section (hide others)
  function showOnlySection(sectionId) {
    const sections = ['home','kaintenun','wanita','pria','aksesoris','penutup'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === sectionId) {
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
      }
    });
    // update active nav link
    document.querySelectorAll('nav a[href^="#"]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const h = href.slice(1);
      if (h === sectionId) a.classList.add('active'); else a.classList.remove('active');
    });
    // scroll to top of the shown section
    const target = document.getElementById(sectionId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Note: the "show all sections" helper was removed per request.

  // Back to top buttons inside sections (attach to all)
  document.querySelectorAll('.back-to-top-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Highlight active category based on scroll position
  (function setupSectionObserver(){
    const categoryMap = {
      '#kaintenun': 'kaintenun',
      '#wanita': 'wanita',
      '#pria': 'pria',
      '#aksesoris': 'aksesoris'
    };
    const options = { root: null, rootMargin: '0px 0px -60% 0px', threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = '#' + entry.target.id;
          const cat = categoryMap[id] || 'kaintenun';
          // set active class on matching thumbnail
          document.querySelectorAll('.shop-categories .cat-btn').forEach(b => b.classList.remove('active'));
          const btn = document.querySelector(`.shop-categories .cat-btn[data-cat="${cat}"]`);
          if (btn) btn.classList.add('active');
        }
      });
    }, options);

    Object.keys(categoryMap).forEach(sel => {
      const el = document.querySelector(sel);
      if (el) observer.observe(el);
    });
  })();

  // (Swipe/drag/carousel features removed as requested)

  // --- Payment Modal Functions ---
  const paymentModal = document.getElementById('payment-modal');
  
  function showPaymentModal(orderData) {
    if (!paymentModal) return;
    
    // Isi data ke modal
    document.getElementById('payment-product').textContent = orderData.product || '-';
    document.getElementById('payment-price').textContent = orderData.price || '-';
    document.getElementById('payment-name').textContent = orderData.name || '-';
    document.getElementById('payment-email').textContent = orderData.email || '-';
    document.getElementById('payment-phone').textContent = orderData.phone || '-';
    document.getElementById('payment-address').textContent = orderData.address || '-';
    
    // Hitung total (parse harga dari string)
    const totalPrice = parsePriceNumber(orderData.price);
    document.getElementById('payment-total').textContent = 'Rp ' + numberWithDots(totalPrice);
    
    // Tampilkan modal
    paymentModal.classList.add('open');
    paymentModal.style.display = 'flex';
  }
  
  function closePaymentModal() {
    if (!paymentModal) return;
    paymentModal.classList.remove('open');
    paymentModal.style.display = 'none';
  }
  
  // Event listeners untuk modal pembayaran
  if (paymentModal) {
    const closeBtn = paymentModal.querySelector('.payment-close-btn');
    const closeActionBtn = paymentModal.querySelector('#payment-close-btn');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closePaymentModal);
    }
    
    if (closeActionBtn) {
      closeActionBtn.addEventListener('click', closePaymentModal);
    }
    
    // Tutup saat klik backdrop
    paymentModal.addEventListener('click', function(e) {
      if (e.target === paymentModal) {
        closePaymentModal();
      }
    });
  }

  // expose a small api
  window.KainTenun = { createBuyButtons, addToCart, showCart };
});

// Fungsi untuk mengirim email konfirmasi login
function sendLoginEmail(email) {
  // Simulasi pengiriman email menggunakan mailto
  const subject = encodeURIComponent('Konfirmasi Login - KainTenun');
  const loginTime = new Date().toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const body = encodeURIComponent(
    `Halo,\n\n` +
    `Terima kasih telah login ke akun KainTenun Anda.\n\n` +
    `Detail Login:\n` +
    `Email: ${email}\n` +
    `Waktu Login: ${loginTime}\n\n` +
    `Jika ini bukan Anda yang melakukan login, mohon segera hubungi kami untuk keamanan akun Anda.\n\n` +
    `Salam,\nTim KainTenun\n\n` +
    `---\n` +
    `Email ini dikirim otomatis, mohon jangan membalas email ini.`
  );
  
  // Simpan informasi bahwa email sudah dikirim
  console.log('Email konfirmasi login dikirim ke:', email);
  console.log('Waktu login:', loginTime);
  
  // Simpan data email ke localStorage untuk riwayat
  const emailHistory = JSON.parse(localStorage.getItem('login_email_history') || '[]');
  emailHistory.push({
    email: email,
    time: loginTime,
    sent: true
  });
  localStorage.setItem('login_email_history', JSON.stringify(emailHistory));
  
  // Catatan: Di aplikasi nyata, ini akan dikirim melalui server menggunakan API email
  // Untuk demo/testing, bisa uncomment baris di bawah untuk membuka aplikasi email:
  // const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
  // window.location.href = mailtoLink;
}

// Fungsi untuk menampilkan pesan sukses login
function showLoginSuccess(email) {
  // Buat modal sukses jika belum ada
  let successModal = document.getElementById('login-success-modal');
  if (!successModal) {
    successModal = document.createElement('div');
    successModal.id = 'login-success-modal';
    successModal.className = 'login-success-modal';
    successModal.innerHTML = `
      <div class="login-success-content">
        <div class="success-icon">✓</div>
        <h3>Login Berhasil!</h3>
        <p>Email konfirmasi telah dikirim ke:</p>
        <p class="success-email">${email}</p>
        <p class="success-message">Anda akan diarahkan ke halaman utama...</p>
      </div>
    `;
    document.body.appendChild(successModal);
  } else {
    successModal.querySelector('.success-email').textContent = email;
  }
  
  // Tampilkan modal
  successModal.style.display = 'flex';
  setTimeout(() => successModal.classList.add('show'), 10);
}

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  if (!loginForm) return; // no login form on this page

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const errorMessage = document.getElementById('errorMessage');

  loginForm.addEventListener('submit', function(event) {
    // Mencegah form untuk submit secara default (ke /proses_login)
    event.preventDefault(); 
        
    // Membersihkan pesan error sebelumnya
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let isValid = true;

    // --- Validasi Sederhana ---
        
    // 1. Validasi Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      errorMessage.textContent = 'Masukkan alamat email yang valid.';
      isValid = false;
    } 
        
    // 2. Validasi Kata Sandi (Minimal 8 karakter)
    else if (password.length < 8) {
      errorMessage.textContent = 'Kata sandi minimal harus 8 karakter.';
      isValid = false;
    }

    // --- Aksi Setelah Validasi ---

    if (isValid) {
      // Jika validasi berhasil
      
      // Simpan data login ke localStorage (untuk simulasi)
      localStorage.setItem('user_email', email);
      localStorage.setItem('is_logged_in', 'true');
      
      // Kirim email konfirmasi login
      sendLoginEmail(email);
      
      // Tampilkan pesan sukses
      showLoginSuccess(email);
      
      // Redirect ke halaman utama setelah 2 detik
      setTimeout(function() {
        window.location.href = 'index.html';
      }, 2000);

    } else {
      // Jika validasi gagal
            
      // Tampilkan pesan error dengan kelas CSS 'show'
      errorMessage.classList.add('show');
    }
  });
});
document.addEventListener('DOMContentLoaded', function() {
    const tombolPemicu = document.getElementById('tampilkan-wanita-btn');
    const bagianWanita = document.getElementById('wanita');

    if (tombolPemicu && bagianWanita) {
        tombolPemicu.addEventListener('click', function() {
            // Menghapus kelas 'hidden' akan membuatnya terlihat
            bagianWanita.classList.remove('hidden'); 
            
            // Opsional: Sembunyikan tombol setelah diklik
            tombolPemicu.style.display = 'none'; 
        });
    }
});