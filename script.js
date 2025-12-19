// ========== Supabase Configuration ==========
const SUPABASE_URL = 'https://teplbwwhawnirulmbpyd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_pKHbbzYnwfAaoXDmDH_Ctg_iKTiP6zf';

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Global variables
let currentUser = null;
let isAdminLoggedIn = false;
let products = [];

// ========== Initialize on Load ==========
window.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 ويب أيديا مع Supabase - متصل!');
    
    // Load products immediately
    await loadProducts();
    
    // Check if admin is logged in
    const savedUser = localStorage.getItem('webaidea_currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isAdminLoggedIn = currentUser.type === 'admin';
        updateUI();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Auto-check table every 5 seconds
    setInterval(checkTableExists, 5000);
});

// ========== Check if Table Exists ==========
async function checkTableExists() {
    try {
        const { error } = await supabase
            .from('products')
            .select('id')
            .limit(1);
        
        if (error && error.message.includes('does not exist')) {
            console.log('⚠️ جدول المنتجات غير موجود بعد');
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

// ========== Load Products ==========
async function loadProducts() {
    try {
        console.log('🔄 جاري تحميل المنتجات من Supabase...');
        
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            if (error.message.includes('does not exist')) {
                console.log('📭 جدول المنتجات غير موجود - سيتم استخدام بيانات تجريبية');
                products = getSampleProducts();
                renderProducts();
                showNotification('⚠️ يستخدم بيانات تجريبية (الجداول غير موجودة)', 'warning');
                return;
            }
            throw error;
        }
        
        products = data || [];
        
        // Render products
        renderProducts();
        
        console.log(`✅ تم تحميل ${products.length} منتج من Supabase`);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
        showNotification('❌ فشل تحميل المنتجات', 'error');
    }
}

// ========== Render Products ==========
function renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (products.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-box-open" style="font-size: 4rem; margin-bottom: 1rem; color: #ccc;"></i>
                <h3>لا توجد منتجات حالياً</h3>
                <p>كن أول من يعرض منتجاتك على المنصة!</p>
                ${!currentUser ? `
                    <a href="javascript:void(0);" class="btn btn-primary" onclick="openAuthModal()" style="margin-top: 1rem;">
                        <i class="fas fa-user-plus"></i> سجل الآن لعرض منتجاتك
                    </a>
                ` : ''}
            </div>
        `;
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Featured badge
        if (product.featured) {
            card.innerHTML = `<div class="special-badge"><i class="fas fa-crown"></i> مميز</div>`;
        }
        
        // Sync status badge
        if (product.source === 'local') {
            card.innerHTML += `
                <div class="special-badge" style="top: 45px; background: #ff9800;">
                    <i class="fas fa-laptop-house"></i> محلي
                </div>
            `;
        }
        
        card.innerHTML += `
            <div class="product-image">
                <img src="${product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                     alt="${product.title || 'منتج'}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Error+Loading'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title || 'بدون عنوان'}</h3>
                <p class="product-description">
                    ${(product.description || '').substring(0, 80)}${product.description && product.description.length > 80 ? '...' : ''}
                </p>
                <div class="product-meta">
                    <div>
                        <div class="product-price">${product.price || 0} ريال</div>
                        <div class="product-merchant">
                            <i class="fas fa-user"></i> ${product.merchant_id || 'تاجر'}
                        </div>
                    </div>
                    <div class="product-date" style="font-size: 0.8rem; color: #666;">
                        <i class="fas fa-calendar"></i> ${product.created_at ? product.created_at.split('T')[0] : ''}
                    </div>
                </div>
                <button class="view-btn" onclick="showProductDetail(${product.id})">
                    <i class="fas fa-eye"></i> عرض التفاصيل
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ========== Sample Products (Fallback) ==========
function getSampleProducts() {
    return [
        {
            id: 1,
            title: "ساعة ذكية جديدة",
            description: "ساعة ذكية بشاشة AMOLED ومقاومة للماء، تدعم الاتصال الهاتفي",
            price: 199,
            image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            merchant_id: "ahmed@example.com",
            contact: "+968 1234 5678",
            featured: true,
            created_at: new Date().toISOString(),
            source: 'sample'
        },
        {
            id: 2,
            title: "سماعات بلوتوث عالية الجودة",
            description: "سماعات لاسلكية بتقنية إلغاء الضوضاء، بطارية تدوم 20 ساعة",
            price: 149,
            image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            merchant_id: "sara@example.com",
            contact: "+968 9876 5432",
            featured: false,
            created_at: new Date().toISOString(),
            source: 'sample'
        }
    ];
}

// ========== Add Product to Supabase ==========
async function addProductToSupabase(title, price, description, imageUrl, contact) {
    try {
        if (!currentUser) {
            showNotification('❌ يجب تسجيل الدخول أولاً', 'error');
            return false;
        }
        
        showNotification('🔄 جاري نشر المنتج إلى السحابة...', 'info');
        
        const { data, error } = await supabase
            .from('products')
            .insert([
                {
                    title: title,
                    price: parseFloat(price),
                    description: description,
                    image_url: imageUrl,
                    merchant_id: currentUser.email,
                    contact: contact,
                    featured: false,
                    created_at: new Date().toISOString()
                }
            ])
            .select();
        
        if (error) {
            if (error.message.includes('does not exist')) {
                // Table doesn't exist - save locally
                console.log('⚠️ جدول غير موجود - حفظ محلياً');
                return await addProductLocally(title, price, description, imageUrl, contact);
            }
            throw error;
        }
        
        console.log('✅ تم إضافة المنتج إلى Supabase:', data);
        
        // Add to local array
        if (data && data[0]) {
            products.unshift(data[0]);
            renderProducts();
        }
        
        showNotification('✅ تم نشر المنتج بنجاح! (يظهر للجميع)', 'success');
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في إضافة المنتج إلى Supabase:', error);
        showNotification('❌ فشل نشر المنتج: ' + error.message, 'error');
        
        // Fallback to local storage
        return await addProductLocally(title, price, description, imageUrl, contact);
    }
}

// ========== Add Product Locally (Fallback) ==========
async function addProductLocally(title, price, description, imageUrl, contact) {
    try {
        // Create product object
        const newProduct = {
            id: Date.now(),
            title: title,
            price: parseFloat(price),
            description: description,
            image_url: imageUrl,
            merchant_id: currentUser.email,
            contact: contact,
            featured: false,
            created_at: new Date().toISOString(),
            source: 'local'
        };
        
        // Add to products array
        products.unshift(newProduct);
        
        // Save to localStorage as backup
        saveProductsToLocalStorage();
        
        // Render products
        renderProducts();
        
        showNotification('✅ تم حفظ المنتج محلياً (انتظر إنشاء الجداول)', 'warning');
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في حفظ المنتج محلياً:', error);
        showNotification('❌ فشل حفظ المنتج', 'error');
        return false;
    }
}

// ========== Save Products to Local Storage ==========
function saveProductsToLocalStorage() {
    try {
        // Filter out sample products
        const userProducts = products.filter(p => p.source !== 'sample');
        localStorage.setItem('webaidea_products_backup', JSON.stringify(userProducts));
        console.log('💾 تم حفظ نسخة احتياطية محلية');
    } catch (error) {
        console.error('❌ خطأ في حفظ النسخة الاحتياطية:', error);
    }
}

// ========== Delete Product ==========
async function deleteProduct(productId) {
    try {
        if (!confirm('هل تريد حذف هذا المنتج؟')) return false;
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) {
            if (error.message.includes('does not exist')) {
                // Delete locally
                products = products.filter(p => p.id != productId);
                saveProductsToLocalStorage();
                renderProducts();
                showNotification('✅ تم حذف المنتج محلياً', 'success');
                return true;
            }
            throw error;
        }
        
        // Remove from local array
        products = products.filter(p => p.id != productId);
        renderProducts();
        
        showNotification('✅ تم حذف المنتج من السحابة (حذف من الجميع)', 'success');
        
        return true;
        
    } catch (error) {
        console.error('❌ خطأ في حذف المنتج:', error);
        showNotification('❌ فشل حذف المنتج', 'error');
        return false;
    }
}

// ========== Show Product Detail ==========
function showProductDetail(productId) {
    const product = products.find(p => p.id == productId);
    if (!product) {
        showNotification('❌ المنتج غير موجود', 'error');
        return;
    }
    
    const detailBody = document.getElementById('detailBody');
    detailBody.innerHTML = `
        <div class="detail-header">
            <div class="detail-image">
                <img src="${product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                     alt="${product.title}"
                     onerror="this.src='https://via.placeholder.com/400x300?text=Error+Loading'">
            </div>
            <div class="detail-info">
                <h2 class="detail-title">${product.title || 'بدون عنوان'}</h2>
                <div class="detail-price">${product.price || 0} ريال</div>
                
                ${product.featured ? `
                    <div class="featured-badge">
                        <i class="fas fa-crown"></i> إعلان مميز
                    </div>
                ` : ''}
                
                ${product.source === 'local' ? `
                    <div class="special-badge" style="margin-top: 10px; background: #ff9800;">
                        <i class="fas fa-laptop-house"></i> مخزن محلياً
                    </div>
                ` : ''}
                
                <div class="detail-merchant">
                    <i class="fas fa-user-tie"></i> 
                    <strong>التاجر:</strong> ${product.merchant_id || 'غير معروف'}
                </div>
                
                <div class="detail-contact">
                    <i class="fas fa-phone"></i> 
                    <strong>رقم التواصل:</strong> ${product.contact || 'غير متوفر'}
                </div>
                
                <div class="detail-date">
                    <i class="fas fa-calendar"></i> 
                    <strong>تاريخ النشر:</strong> ${product.created_at ? product.created_at.split('T')[0] : 'غير معروف'}
                </div>
            </div>
        </div>
        
        <div class="detail-description">
            <h3><i class="fas fa-align-right"></i> وصف المنتج</h3>
            <p>${product.description || 'لا يوجد وصف للمنتج'}</p>
        </div>
        
        <div class="detail-actions">
            <button class="btn btn-secondary" onclick="closeDetailModal()">
                <i class="fas fa-times"></i> إغلاق
            </button>
            
            ${currentUser && (currentUser.email === product.merchant_id || currentUser.type === 'admin') ? `
                <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i> حذف المنتج
                </button>
            ` : ''}
        </div>
    `;
    
    document.getElementById('productDetailModal').style.display = 'flex';
}

// ========== Setup Event Listeners ==========
function setupEventListeners() {
    // Login button
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openAuthModal);
    }
    
    // Admin dashboard button
    const adminBtn = document.getElementById('adminDashboardBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', showAdminPanel);
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
    
    // Contact button
    const contactBtn = document.querySelector('.btn-contact');
    if (contactBtn) {
        contactBtn.addEventListener('click', redirectToInstagram);
    }
    
    // Menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    }
}

// ========== Merchant Post Ad ==========
function openMerchantAdModal() {
    if (!currentUser) {
        alert('❌ يجب تسجيل الدخول أولاً');
        openAuthModal();
        return;
    }
    
    if (currentUser.type !== 'merchant' && currentUser.type !== 'admin') {
        alert('❌ يجب أن تكون تاجراً لنشر إعلان');
        return;
    }
    
    const modal = document.createElement('div');
    modal.id = 'merchantAdModal';
    modal.style.cssText = `
        position: fixed;
        top: 0; right: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.7);
        z-index: 2000;
        display: flex;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(5px);
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="margin: 0; color: #333;">
                    <i class="fas fa-bullhorn"></i> نشر إعلان جديد
                </h2>
                <span onclick="closeMerchantAdModal()" style="font-size: 1.5rem; cursor: pointer; color: #666;">&times;</span>
            </div>
            
            <form id="merchantAdForm" onsubmit="postMerchantAd(event)">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">عنوان المنتج *</label>
                    <input type="text" id="merchantAdTitle" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;" placeholder="مثال: ساعة ذكية Apple">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">السعر (ريال) *</label>
                    <input type="number" id="merchantAdPrice" required min="1" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;" placeholder="مثال: 199">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">وصف المنتج *</label>
                    <textarea id="merchantAdDescription" rows="3" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;" placeholder="وصف مفصل عن المنتج..."></textarea>
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">رقم التواصل *</label>
                    <input type="tel" id="merchantAdContact" required pattern="[0-9+]{8,}" style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;" placeholder="+96812345678">
                </div>
                
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">رابط صورة المنتج *</label>
                    <input type="url" id="merchantAdImage" required style="width: 100%; padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;" placeholder="https://example.com/image.jpg">
                    <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                        <i class="fas fa-info-circle"></i> يمكنك رفع الصورة إلى <a href="https://imgbb.com/" target="_blank" style="color: #4361ee;">imgbb.com</a> للحصول على رابط مجاني
                    </p>
                </div>
                
                <div style="background: #fff8e1; padding: 1rem; border-radius: 8px; border-right: 4px solid #ffb300; margin-bottom: 1.5rem;">
                    <p style="margin: 0; color: #666; font-size: 0.9rem;">
                        <i class="fas fa-info-circle"></i> سيظهر إعلانك فوراً للجميع! عند الحذف، يحذف من الكل.
                    </p>
                </div>
                
                <button type="submit" style="background: linear-gradient(135deg, #4361ee, #3a0ca3); color: white; width: 100%; padding: 1rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-paper-plane"></i> نشر الإعلان
                </button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function postMerchantAd(event) {
    event.preventDefault();
    
    const title = document.getElementById('merchantAdTitle').value.trim();
    const price = document.getElementById('merchantAdPrice').value;
    const description = document.getElementById('merchantAdDescription').value.trim();
    const contact = document.getElementById('merchantAdContact').value.trim();
    const imageUrl = document.getElementById('merchantAdImage').value.trim();
    
    if (!title || !price || !description || !contact || !imageUrl) {
        alert('⚠️ يرجى ملء جميع الحقول المطلوبة');
        return;
    }
    
    if (!imageUrl.startsWith('http')) {
        alert('⚠️ الرابط يجب أن يبدأ بـ http:// أو https://');
        return;
    }
    
    if (!confirm('هل تريد نشر هذا الإعلان؟')) return;
    
    const success = await addProductToSupabase(title, price, description, imageUrl, contact);
    
    if (success) {
        closeMerchantAdModal();
    }
}

function closeMerchantAdModal() {
    const modal = document.getElementById('merchantAdModal');
    if (modal) modal.remove();
}

// ========== Authentication Functions ==========
function openAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
    document.getElementById('email').focus();
    
    // Reset to login mode
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn.textContent !== 'دخول') {
        switchAuthMode();
    }
}

function closeModal() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('authForm').reset();
}

function closeDetailModal() {
    document.getElementById('productDetailModal').style.display = 'none';
}

function switchAuthMode() {
    const title = document.getElementById('modalTitle');
    const submitBtn = document.getElementById('submitBtn');
    const switchText = document.getElementById('switchText');
    const switchLink = document.getElementById('switchLink');
    const nameField = document.getElementById('nameField');
    
    if (submitBtn.textContent === 'دخول') {
        // Switch to register
        title.textContent = 'انشاء حساب جديد';
        submitBtn.textContent = 'تسجيل';
        switchText.textContent = 'لديك حساب بالفعل؟';
        switchLink.textContent = 'تسجيل الدخول';
        nameField.style.display = 'block';
    } else {
        // Switch to login
        title.textContent = 'تسجيل الدخول';
        submitBtn.textContent = 'دخول';
        switchText.textContent = 'ليس لديك حساب؟';
        switchLink.textContent = 'انشاء حساب جديد';
        nameField.style.display = 'none';
    }
}

async function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const name = document.getElementById('name')?.value.trim() || '';
    const isLoginMode = document.getElementById('submitBtn').textContent === 'دخول';
    
    // Admin login
    if (email === 'msdfrrt@gmail.com' && password === 'Shabib95873061@99') {
        currentUser = {
            name: 'Administrator',
            email: email,
            type: 'admin'
        };
        isAdminLoggedIn = true;
        
        localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
        
        updateUI();
        closeModal();
        showNotification('🎉 مرحباً بك في لوحة الإدارة!', 'success');
        return;
    }
    
    if (isLoginMode) {
        // Simple demo login
        currentUser = {
            name: email.split('@')[0],
            email: email,
            type: 'merchant'
        };
        isAdminLoggedIn = false;
        
        localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
        
        updateUI();
        closeModal();
        showNotification(`🎉 مرحباً بعودتك ${currentUser.name}!`, 'success');
    } else {
        // Register
        currentUser = {
            name: name || email.split('@')[0],
            email: email,
            type: 'user'
        };
        isAdminLoggedIn = false;
        
        localStorage.setItem('webaidea_currentUser', JSON.stringify(currentUser));
        
        updateUI();
        closeModal();
        showNotification(`🎉 تم إنشاء حسابك بنجاح ${currentUser.name}!`, 'success');
    }
}

// ========== Update UI ==========
function updateUI() {
    // Update navbar buttons
    const adminBtn = document.getElementById('adminDashboardBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginBtn = document.querySelector('.login-btn');
    
    if (currentUser) {
        // Hide login button
        if (loginBtn) loginBtn.style.display = 'none';
        
        // Show logout button
        if (logoutBtn) logoutBtn.style.display = 'flex';
        
        // Show admin button for admin only
        if (adminBtn) {
            if (isAdminLoggedIn && currentUser.type === 'admin') {
                adminBtn.style.display = 'flex';
            } else {
                adminBtn.style.display = 'none';
            }
        }
        
        // Show merchant post button
        if (currentUser.type === 'merchant' || currentUser.type === 'admin') {
            showMerchantPostButton();
        } else {
            // Remove post button if not merchant
            const postBtn = document.getElementById('merchantPostBtn');
            if (postBtn) postBtn.remove();
        }
        
    } else {
        // Show login button
        if (loginBtn) loginBtn.style.display = 'flex';
        
        // Hide admin and logout buttons
        if (adminBtn) adminBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        
        // Remove merchant post button
        const postBtn = document.getElementById('merchantPostBtn');
        if (postBtn) postBtn.remove();
    }
}

// ========== Show Merchant Post Button ==========
function showMerchantPostButton() {
    // Remove old button
    const oldBtn = document.getElementById('merchantPostBtn');
    if (oldBtn) oldBtn.remove();
    
    // Create new button
    const postBtn = document.createElement('a');
    postBtn.id = 'merchantPostBtn';
    postBtn.className = 'btn btn-primary';
    postBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 1000;
        padding: 12px 20px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    postBtn.innerHTML = `<i class="fas fa-plus-circle"></i> نشر إعلان`;
    postBtn.href = 'javascript:void(0);';
    postBtn.onclick = openMerchantAdModal;
    
    document.body.appendChild(postBtn);
}

// ========== Logout User ==========
function logoutUser() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        currentUser = null;
        isAdminLoggedIn = false;
        
        localStorage.removeItem('webaidea_currentUser');
        
        updateUI();
        
        showNotification('✅ تم تسجيل الخروج بنجاح', 'success');
    }
}

// ========== Admin Functions ==========
function showAdminPanel() {
    if (!isAdminLoggedIn) {
        alert('❌ يجب أن تكون مديراً للدخول');
        return;
    }
    
    const adminPanel = document.getElementById('adminPanel');
    if (!adminPanel) return;
    
    adminPanel.style.display = 'block';
    
    // Hide main site sections
    const sectionsToHide = ['.hero', '.products-section', '.how-section', '.footer'];
    sectionsToHide.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = 'none';
    });
    
    // Hide original navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.display = 'none';
    
    // Load admin data
    renderAdminTables();
}

function showMainSite() {
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) adminPanel.style.display = 'none';
    
    // Show main site sections
    const sectionsToShow = ['.hero', '.products-section', '.how-section', '.footer'];
    sectionsToShow.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.style.display = '';
    });
    
    // Show original navbar
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.display = 'block';
}

function goToMainSite() {
    if (confirm('هل تريد العودة للقائمة الرئيسية؟')) {
        logoutAdmin();
    }
}

function logoutAdmin() {
    if (confirm('هل تريد تسجيل الخروج من لوحة الإدارة؟')) {
        isAdminLoggedIn = false;
        
        // If admin is current user, logout completely
        if (currentUser && currentUser.type === 'admin') {
            currentUser = null;
            localStorage.removeItem('webaidea_currentUser');
        }
        
        showMainSite();
        updateUI();
        
        showNotification('✅ تم تسجيل الخروج من لوحة الإدارة', 'success');
    }
}

// ========== Admin Tables (Simplified) ==========
async function renderAdminTables() {
    // For now, just show basic info
    const adsTable = document.querySelector('#adsTable tbody');
    if (adsTable) {
        adsTable.innerHTML = '';
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <img src="${product.image_url || 'https://via.placeholder.com/50'}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;">
                </td>
                <td>${product.title || 'بدون عنوان'}</td>
                <td>${product.price || 0}</td>
                <td>${product.merchant_id || 'غير معروف'}</td>
                <td>${product.created_at ? product.created_at.split('T')[0] : ''}</td>
                <td>
                    <button class="action-btn btn-remove" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            adsTable.appendChild(row);
        });
    }
}

// ========== Helper Functions ==========
function redirectToInstagram() {
    window.open('https://www.instagram.com/webaidea?igsh=ajVyNm0yZHdlMnNi&utm_source=qr', '_blank');
}

function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.classList.toggle('active');
}

// ========== Notification System ==========
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    // Set color based on type
    if (type === 'success') {
        notification.style.background = '#4CAF50';
    } else if (type === 'warning') {
        notification.style.background = '#ff9800';
    } else if (type === 'error') {
        notification.style.background = '#f44336';
    } else {
        notification.style.background = '#2196F3';
    }
    
    // Add icon
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    if (type === 'error') icon = 'times-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}" style="font-size: 1.2rem;"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Add CSS animation if not exists
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ========== Create Table Button ==========
function addCreateTableButton() {
    const btn = document.createElement('button');
    btn.id = 'createTableBtn';
    btn.className = 'btn btn-secondary';
    btn.style.cssText = `
        position: fixed;
        bottom: 70px;
        left: 20px;
        z-index: 1000;
        padding: 10px 15px;
        border-radius: 25px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 8px;
        background: #ff9800;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
    `;
    btn.innerHTML = `<i class="fas fa-database"></i> إنشاء الجداول`;
    btn.onclick = function() {
        createTableManually();
    };
    
    document.body.appendChild(btn);
}

function createTableManually() {
    const sqlCode = `
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    price NUMERIC NOT NULL,
    description TEXT,
    image_url TEXT,
    merchant_id TEXT,
    contact TEXT,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable public access
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable public access" ON products;
CREATE POLICY "Enable public access" ON products
    FOR ALL USING (true)
    WITH CHECK (true);
`;
    
    alert(`❗ لإنشاء الجداول يدوياً:\n\n1. سجل دخول إلى Supabase\n2. اذهب إلى SQL Editor\n3. الصق هذا الكود:\n\n${sqlCode}\n\n4. اضغط Run`);
    
    console.log('📋 كود SQL لإنشاء الجداول:', sqlCode);
}

// ========== Auto-add Create Table Button ==========
setTimeout(() => {
    addCreateTableButton();
}, 2000);

// ========== Success Message ==========
console.log('🎯 موقع ويب أيديا متصل بـ Supabase بنجاح!');
console.log('📊 قاعدة البيانات: https://teplbwwhawnirulmbpyd.supabase.co');
console.log('🔑 المفتاح: sb_publishable_pKHbbzYnwfAaoXDmDH_Ctg_iKTiP6zf');
console.log('👑 بيانات المدير: msdfrrt@gmail.com / Shabib95873061@99');