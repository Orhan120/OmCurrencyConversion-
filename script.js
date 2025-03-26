const apiKey = 'dfa9454b75f5afa095e9075b';
const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

// Döviz verilerini çekme
async function fetchExchangeRates() {
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const rates = data.conversion_rates;
        const timestamp = new Date(data.time_last_updated * 1000);

        // Tarih ve saat formatı
        const formattedDateTime = formatDateTime(timestamp);
        const formattedDate = formatDate(timestamp);

        displayRates(rates);
        populateCurrencyOptions(rates);
        document.getElementById('last-updated').innerText = `Son güncelleme: ${formattedDateTime}`;
        document.getElementById('currency-date').innerText = formattedDate;

        // Döviz kurlarını global değişkene kaydet
        currentRates = rates;

        // Veri güncellendiğinde olay tetikle
        document.dispatchEvent(new CustomEvent('ratesUpdated', { detail: rates }));

        return rates;
    } catch (error) {
        document.getElementById('exchange-rates').innerHTML = 'Veri alınamadı!';
        console.error('Döviz verileri alınamadı:', error);
        return {};
    }
}

// Tarih ve saat formatı
function formatDateTime(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    };
    return date.toLocaleDateString('tr-TR', options);
}

// Sadece tarih formatı
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    return date.toLocaleDateString('tr-TR', options);
}

// 30 dakikada bir otomatik güncelleme
function setupAutoRefresh() {
    // Sayfa yüklendiğinde ilk kez verileri çek
    fetchExchangeRates();

    // 30 dakikada bir güncelle (30 * 60 * 1000 = 1800000 milisaniye)
    setInterval(fetchExchangeRates, 1800000);
}

// Döviz kartlarını ekrana yazdırma
function displayRates(rates) {
    const importantCurrencies = ['USD', 'AZN', 'RUB', 'TRY', 'EUR', 'GBP'];
    let html = '';

    // Gösterilecek para birimlerini belirle
    const currenciesToShow = Object.keys(rates).filter(curr => 
        importantCurrencies.includes(curr) || favoriteManager.isFavorite(curr)
    );

    // Normal dövizler
    currenciesToShow.forEach(currency => {
        if (rates[currency]) {
            const rateChange = calculateRateChange(currency);
            const barClass = rateChange >= 0 ? 'green' : 'red';
            const icon = getCurrencyIcon(currency);
            html += `
                <div class="rate-card" data-currency="${currency}">
                    <h3>
                        <i class="${icon}"></i> ${currency}
                        <i class="fas fa-star favorite-icon ${favoriteManager.isFavorite(currency) ? 'active' : ''}" 
                           onclick="toggleFavorite('${currency}')" 
                           style="cursor: pointer; font-size: 0.8em; margin-left: 5px;"></i>
                    </h3>
                    <p>${rates[currency]}</p>
                    <div class="rate-bar-container">
                        <div class="rate-bar ${barClass}" style="width: ${Math.abs(rateChange)}%;"></div>
                    </div>
                    <p class="rate-change ${barClass}">${rateChange >= 0 ? '+' : ''}${rateChange.toFixed(2)}%</p>
                </div>
            `;
        }
    });

    document.getElementById('exchange-rates').innerHTML = html;

    // Favori ikonlarını güncelle
    favoriteManager.updateIcons();
}

// Değişim yüzdesi simülasyonu
function calculateRateChange(currency) {
    return Math.random() * 10 - 5; // -5 ile 5 arasında rastgele değişim
}

// Dönüştürücüdeki döviz seçeneklerini doldur
function populateCurrencyOptions(rates) {
    const fromSelect = document.getElementById('from-currency');
    const toSelect = document.getElementById('to-currency');
    fromSelect.innerHTML = toSelect.innerHTML = '';
    Object.keys(rates).forEach(currency => {
        fromSelect.innerHTML += `<option value="${currency}">${currency}</option>`;
        toSelect.innerHTML += `<option value="${currency}">${currency}</option>`;
    });
    fromSelect.value = 'USD';
    toSelect.value = 'TRY';
}

// Dönüştürme işlemi
async function convertCurrency() {
    const amount = document.getElementById('amount').value;
    const fromCurrency = document.getElementById('from-currency').value;
    const toCurrency = document.getElementById('to-currency').value;

    try {
        const response = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/pair/${fromCurrency}/${toCurrency}`);
        const data = await response.json();
        const result = (amount * data.conversion_rate).toFixed(2);

        document.getElementById('result').innerHTML = `
            Sonuç: ${result} ${toCurrency}
            <i onclick="addToFavorites('${toCurrency}')" class="fas fa-star favorite-icon ${favoriteManager.isFavorite(toCurrency) ? 'active' : ''}" style="cursor: pointer; margin-left: 10px;"></i>
        `;
    } catch (error) {
        document.getElementById('result').innerText = 'Dönüştürme başarısız!';
    }
}

function addToFavorites(currency) {
    if (!favoriteManager.isFavorite(currency)) {
        favoriteManager.toggle(currency);

        // Yıldız ikonunu güncelle
        const starIcon = document.querySelector('#result .fa-star');
        if (starIcon) {
            starIcon.classList.add('active');
        }
    }
}

function updateFavoritesList() {
    favoriteManager.displayFavorites();
}

// Tema değiştirme fonksiyonu - Geliştirilmiş animasyonlu versiyon
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-switch');
    if (!themeToggle) return;

    function applyTheme(theme) {
        document.body.classList.toggle('light-theme', theme === 'light');
        document.body.classList.add('theme-transition');
        localStorage.setItem('theme', theme);

        const cards = document.querySelectorAll('.rate-card, .converter-container');
        cards.forEach((card, index) => {
            card.style.transitionDelay = `${index * 0.05}s`;
        });

        setTimeout(() => {
            document.body.classList.remove('theme-transition');
            cards.forEach(card => {
                card.style.transitionDelay = '';
            });
        }, 500);

        showThemeChangeNotification();
    }

    // Başlangıç temasını ayarla
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // Tema değiştirme olayını dinle
    themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
        applyTheme(newTheme);
    });
}

// Tema değişikliği bildirim animasyonu
function showThemeChangeNotification() {
    // Eğer zaten bir bildirim varsa, onu kaldır
    const existingNotification = document.querySelector('.theme-notification');
    if (existingNotification) {
        document.body.removeChild(existingNotification);
    }

    const isLightTheme = document.body.classList.contains('light-theme');
    const message = isLightTheme ? 'Aydınlık Tema Aktif' : 'Karanlık Tema Aktif';
    const icon = isLightTheme ? 'fas fa-sun' : 'fas fa-moon';

    // Bildirim elementi oluştur
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.innerHTML = `<i class="${icon}"></i> ${message}`;

    // Stiller ekle
    notification.style.position = 'fixed';
    notification.style.bottom = '30px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%) translateY(100px)';
    notification.style.backgroundColor = 'var(--accent-color)';
    notification.style.color = 'var(--bg-color)';
    notification.style.padding = '12px 25px';
    notification.style.borderRadius = '50px';
    notification.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    notification.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    notification.style.fontWeight = 'bold';

    // Bildirim animasyonu
    document.body.appendChild(notification);

    // Animasyon zamanlaması
    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    setTimeout(() => {
        notification.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Kripto para verilerini çek
async function fetchCryptoRates() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,binancecoin,cardano&vs_currencies=usd');
        const data = await response.json();
        return {
            'BTC': data.bitcoin.usd,
            'ETH': data.ethereum.usd,
            'USDT': data.tether.usd,
            'BNB': data.binancecoin.usd,
            'ADA': data.cardano.usd
        };
    } catch (error) {
        console.error('Kripto verileri alınamadı:', error);
        showNotification('Kripto verileri alınamadı');
        return {};
    }
}

// Kripto para verilerini göster
async function displayCryptoRates() {
    try {
        const cryptoRates = await fetchCryptoRates();

        let html = `
            <div class="crypto-grid">
        `;

        Object.entries(cryptoRates).forEach(([symbol, rate]) => {
            html += `
                <div class="rate-card" data-currency="${symbol}">
                    <h3>
                        <i class="fab fa-bitcoin"></i> ${symbol}
                        <i class="fas fa-star favorite-icon ${favoriteManager.isFavorite(symbol) ? 'active' : ''}" 
                           onclick="toggleFavorite('${symbol}')" 
                           style="cursor: pointer; font-size: 0.8em; margin-left: 5px;"></i>
                    </h3>
                    <p>${rate} USD</p>
                </div>
            `;
        });

        html += '</div>';
        document.getElementById('crypto-rates').innerHTML = html;
        document.getElementById('crypto-rates').style.display = 'block';
    } catch (error) {
        console.error('Kripto verileri gösterilemedi:', error);
        showNotification('Kripto verileri gösterilemedi');
    }
}

// Para birimi ikonlarını belirle
function getCurrencyIcon(currency) {
    const icons = {
        'USD': 'fas fa-dollar-sign',
        'EUR': 'fas fa-euro-sign',
        'GBP': 'fas fa-pound-sign',
        'TRY': 'fas fa-lira-sign',
        'RUB': 'fas fa-ruble-sign',
        'AZN': 'fas fa-money-bill-wave'
    };

    return icons[currency] || 'fas fa-money-bill-alt';
}

// Sayfa yüklendiğinde tarihi manuel olarak güncelleyelim
function updateDateDisplay() {
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate);

    // Tarihi hemen göster
    const currencyDateElement = document.getElementById('currency-date');
    if (currencyDateElement) {
        currencyDateElement.style.display = 'block';
        currencyDateElement.innerText = formattedDate;
        console.log("Tarih güncellendi:", formattedDate);
    } else {
        console.error("currency-date elementi bulunamadı");
    }

    // Son güncelleme tarihini de göster
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.style.display = 'block';
        lastUpdatedElement.innerText = `Son güncelleme: ${formatDateTime(currentDate)}`;
    } else {
        console.error("last-updated elementi bulunamadı");
    }
}

// Sayfa yüklendiğinde yapılacaklar
// Chart.js kütüphanesini ekleyelim
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
document.head.appendChild(script);

// Favori para birimleri yönetimi favoriteManager tarafından yapılıyor

// Grafik oluştur
async function createChart(currency, timeframe, compareCurrency = null) {
    try {
        const chartContainer = document.getElementById('chart-container');
        const ctx = document.getElementById('rateChart').getContext('2d');
        const chartTitle = document.getElementById('chart-title');

        if (!ctx) {
            console.error('Grafik canvas bulunamadı');
            return;
        }

        // Show chart container
        chartContainer.style.display = 'block';

        // Get chart data for main currency
        const data = await fetchHistoricalData(currency, timeframe);

        // Prepare datasets
        const datasets = [{
            label: `${currency} Kuru`,
            data: data.values,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
            fill: true,
            backgroundColor: 'rgba(75, 192, 192, 0.1)'
        }];

        // If comparison mode is active, add second dataset
        if (compareCurrency) {
            const compareData = await fetchHistoricalData(compareCurrency, timeframe);
            datasets.push({
                label: `${compareCurrency} Kuru`,
                data: compareData.values,
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
                fill: true,
                backgroundColor: 'rgba(255, 99, 132, 0.1)'
            });

            chartTitle.textContent = `${currency} ve ${compareCurrency} Karşılaştırması`;
        } else {
            chartTitle.textContent = `${currency} - ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Değişim`;
        }

        // Destroy existing chart if any
        if (window.currentChart) {
            window.currentChart.destroy();
        }

        // Create new chart
        window.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color'),
                            font: {
                                size: 14
                            }
                        },
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: getComputedStyle(document.body).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.body).getPropertyValue('--accent-color'),
                        bodyColor: getComputedStyle(document.body).getPropertyValue('--text-color'),
                        borderColor: getComputedStyle(document.body).getPropertyValue('--accent-color'),
                        borderWidth: 1
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color')
                        },
                        grid: {
                            color: 'rgba(128, 128, 128, 0.2)'
                        }
                    },
                    x: {
                        ticks: {
                            color: getComputedStyle(document.body).getPropertyValue('--text-color')
                        },
                        grid: {
                            color: 'rgba(128, 128, 128, 0.2)'
                        }
                    }
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear'
                    }
                }
            }
        });

        // Show close button
        const closeChartBtn = document.getElementById('closeChart');
        if (closeChartBtn) {
            closeChartBtn.style.display = 'block';
        }

    } catch (error) {
        console.error('Grafik oluşturma hatası:', error);
        showNotification('Grafik oluşturulamadı');
    }
}

// Tarihsel veri çek
async function fetchHistoricalData(currency, timeframe) {
    // Gerçek API'den veri çekilecek
    const now = new Date();
    const labels = [];
    const values = [];
    let interval;

    switch(timeframe) {
        case 'hourly':
            interval = 24;
            for(let i = interval - 1; i >= 0; i--) {
                const time = new Date(now - i * 3600000);
                labels.push(time.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'}));
                values.push(Math.random() * 5 + 25);
            }
            break;
        case 'daily':
            interval = 30;
            for(let i = interval - 1; i >= 0; i--) {
                const date = new Date(now - i * 86400000);
                labels.push(date.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'}));
                values.push(Math.random() * 5 + 25);
            }
            break;
        case 'weekly':
            interval = 12;
            for(let i = interval - 1; i >= 0; i--) {
                const date = new Date(now - i * 604800000);
                labels.push(date.toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'}));
                values.push(Math.random() * 5 + 25);
            }
            break;
    }

    return { labels, values };
}

// Alarm kontrol ve bildirim fonksiyonları
function setupAlarms() {
    const alarmBtn = document.getElementById('setAlarm');
    const alarmCurrencySelect = document.getElementById('alarmCurrency');

    // Para birimi seçeneklerini doldur
    function populateAlarmCurrencies() {
        alarmCurrencySelect.innerHTML = '';
        Object.keys(currentRates || {}).forEach(currency => {
            const option = document.createElement('option');
            option.value = currency;
            option.textContent = currency;
            alarmCurrencySelect.appendChild(option);
        });
    }

    // Sayfa yüklendiğinde seçenekleri doldur
    populateAlarmCurrencies();

    // Veri güncellendiğinde seçenekleri yeniden doldur
    document.addEventListener('ratesUpdated', populateAlarmCurrencies);

    alarmBtn.addEventListener('click', () => {
        const currency = alarmCurrencySelect.value;
        const targetRate = parseFloat(document.getElementById('alarmRate').value);

        if(currency && targetRate > 0) {
            // Bildirim izni iste
            if (!("Notification" in window)) {
                alert("Bu tarayıcı bildirim desteği sunmuyor");
            } else if (Notification.permission !== "granted") {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        setUpAlarmForCurrency(currency, targetRate);
                    } else {
                        showNotification("Bildirim izni verilmedi!");
                    }
                });
            } else {
                setUpAlarmForCurrency(currency, targetRate);
            }
        } else {
            showNotification("Lütfen geçerli bir hedef kur girin");
        }
    });

    function setUpAlarmForCurrency(currency, targetRate) {
        const alarms = JSON.parse(localStorage.getItem('alarms') || '{}');
        alarms[currency] = {
            targetRate,
            active: true,
            timestamp: Date.now()
        };
        localStorage.setItem('alarms', JSON.stringify(alarms));
        showNotification(`${currency} için ${targetRate} hedefinde alarm kuruldu`);
        startAlarmCheck();
    }
}

// Alarm kontrolü başlat
function startAlarmCheck() {
    // Daha önce interval oluşturulmuş mu kontrol et
    if (window.alarmCheckInterval) {
        clearInterval(window.alarmCheckInterval);
    }

    // Yeni kontrol intervalı oluştur
    window.alarmCheckInterval = setInterval(async () => {
        const alarms = JSON.parse(localStorage.getItem('alarms') || '{}');

        // Güncel kurları çek
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            const rates = data.conversion_rates;

            Object.entries(alarms).forEach(([currency, alarm]) => {
                if (alarm.active && rates[currency]) {
                    const currentRate = rates[currency];

                    // Hedef değere ulaşıldı mı kontrol et
                    if (currentRate >= alarm.targetRate) {
                        // Masaüstü bildirimi gönder
                        if (Notification.permission === 'granted') {
                            const notification = new Notification('Döviz Alarmı', {
                                body: `${currency} hedef değere ulaştı: ${currentRate}`,
                                icon: '/attached_assets/Om.img.png',
                                vibrate: [200, 100, 200]
                            });

                            // Bildirime tıklandığında
                            notification.onclick = function() {
                                window.focus();
                                this.close();
                            };
                        }

                        // Uygulama içi bildirim göster
                        showNotification(`${currency} hedef değere ulaştı: ${currentRate}`);

                        // Alarm durumunu güncelle
                        alarm.active = false;
                        localStorage.setItem('alarms', JSON.stringify(alarms));
                    }
                }
            });
        } catch (error) {
            console.error('Alarm kontrolü sırasında hata:', error);
        }
    }, 30000); // Her 30 saniyede bir kontrol et
}

// Mock veri oluştur
function generateMockData() {
    const labels = [];
    const values = [];
    const now = new Date();

    for(let i = 0; i < 24; i++) {
        labels.push(`${i}:00`);
        values.push(Math.random() * 5 + 25);
    }

    return { labels, values };
}

// Favorileri oluştur ve yönet
const favoriteManager = {
    favorites: [],

    // Favorileri yükle
    load: function() {
        try {
            const stored = localStorage.getItem('favorites');
            this.favorites = stored ? JSON.parse(stored) : [];
            console.log('Favoriler yüklendi:', this.favorites);
            this.updateButton();
            return this.favorites;
        } catch (error) {
            console.error('Favoriler yüklenemedi:', error);
            this.favorites = [];
            return [];
        }
    },

    // Favorileri kaydet
    save: function() {
        try {
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            console.log('Favoriler kaydedildi:', this.favorites);
            this.updateButton();
        } catch (error) {
            console.error('Favoriler kaydedilemedi:', error);
            showNotification('Favoriler kaydedilemedi');
        }
    },

    // Favori ekle veya çıkar
    toggle: function(currency) {
        try {
            const index = this.favorites.indexOf(currency);

            if (index === -1) {
                this.favorites.push(currency);
                showNotification(`${currency} favorilere eklendi`);
            } else {
                this.favorites.splice(index, 1);
                showNotification(`${currency} favorilerden çıkarıldı`);
            }

            this.save();
            this.updateIcons();

            // Eğer favoriler görünümündeyse listeyi güncelle
            const favoritesBtn = document.getElementById('showFavorites');
            if (favoritesBtn && favoritesBtn.classList.contains('active')) {
                this.displayFavorites();
            }

            return index === -1; // Eklendi mi? (true: eklendi, false: çıkarıldı)
        } catch (error) {
            console.error('Favori işlemi hatası:', error);
            showNotification('Favori işlemi başarısız oldu');
            return false;
        }
    },

    // Favori mi kontrol et
    isFavorite: function(currency) {
        return this.favorites.includes(currency);
    },

    // Favori butonunu güncelle
    updateButton: function() {
        const favoritesBtn = document.getElementById('showFavorites');
        if (favoritesBtn) {
            favoritesBtn.innerHTML = `<i class="fas fa-star"></i> Favoriler (${this.favorites.length})`;
        }
    },

    // Tüm favori ikonlarını güncelle
    updateIcons: function() {
        // Önce tüm yıldızları sıfırla
        document.querySelectorAll('.fa-star').forEach(icon => {
            icon.classList.remove('active');
        });

        // Favori olanları işaretle
        this.favorites.forEach(currency => {
            document.querySelectorAll(`[data-currency="${currency}"] .fa-star`).forEach(icon => {
                icon.classList.add('active');
            });
        });

        // Sonuç alanındaki yıldızı da güncelle
        const resultStar = document.querySelector('#result .fa-star');
        if (resultStar) {
            const currency = document.getElementById('to-currency')?.value;
            if (currency) {
                resultStar.classList.toggle('active', this.isFavorite(currency));
            }
        }
    },

    // Favorileri göster
    displayFavorites: function() {
        if (this.favorites.length === 0) {
            showNotification('Henüz favori para biriminiz yok');
            return false;
        }

        const filteredRates = {};
        this.favorites.forEach(curr => {
            if (currentRates[curr]) {
                filteredRates[curr] = currentRates[curr];
            }
        });

        if (Object.keys(filteredRates).length > 0) {
            displayRates(filteredRates);
            showNotification('Favoriler görüntüleniyor');
            return true;
        } else {
            showNotification('Favori para birimleri yüklenemedi');
            return false;
        }
    }
};

// Favorileri güncelle (dış kullanım için)
function toggleFavorite(currency) {
    return favoriteManager.toggle(currency);
}

// Favori mi kontrol et (dış kullanım için)
function isFavorite(currency) {
    return favoriteManager.isFavorite(currency);
}


// Alarm kontrolü
function startAlarmCheck() {
    setInterval(async () => {
        const alarms = JSON.parse(localStorage.getItem('alarms') || '{}');

        for (const [currency, alarm] of Object.entries(alarms)) {
            if (alarm.active && currentRates[currency]) {
                const currentRate = currentRates[currency];
                if (currentRate >= alarm.target) {
                    new Notification('Döviz Alarmı', {
                        body: `${currency} hedef değere ulaştı: ${currentRate}`,
                        icon: '/attached_assets/Om.img.png'
                    });
                    alarm.active = false;
                    localStorage.setItem('alarms', JSON.stringify(alarms));
                }
            }
        }
    }, 30000); // Her 30 saniyede bir kontrol et
}

// Alarm kontrolü
async function checkAlarms() {
    const alarms = JSON.parse(localStorage.getItem('alarms') || '{}');

    try {
        // Use the existing fetchExchangeRates function instead of undefined fetchLatestRates
        const response = await fetch(apiUrl);
        const data = await response.json();
        const rates = data.conversion_rates;

        Object.entries(alarms).forEach(([currency, alarm]) => {
            if (alarm.active && rates[currency]) {
                const currentRate = rates[currency];
                if (currentRate >= alarm.target) {
                    showNotification(`${currency} hedef değere ulaştı: ${currentRate}`);
                    alarm.active = false;
                    localStorage.setItem('alarms', JSON.stringify(alarms));
                }
            }
        });
    } catch (error) {
        console.error('Alarm kontrolü sırasında hata:', error);
    }
}


// Bildirim göster
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("Sayfa yüklendi, işlemler başlatılıyor");

    // Favorileri yükle
    favoriteManager.load();

    setupAutoRefresh();
    setupThemeToggle();
    setupAlarms();

    // Kripto butonu
    document.getElementById('showCrypto').addEventListener('click', async () => {
        const cryptoSection = document.getElementById('crypto-rates');
        if (cryptoSection.style.display === 'block') {
            cryptoSection.style.display = 'none';
            showNotification('Kripto para birimleri gizlendi');
        } else {
            try {
                await displayCryptoRates();
                showNotification('Kripto para birimleri yüklendi');
            } catch (error) {
                console.error('Kripto verilerinde hata:', error);
                showNotification('Kripto verilerini görüntüleme hatası');
            }
        }
    });

    // Grafik kontrolleri
    document.getElementById('chartCurrency').addEventListener('change', () => {
        const currency = document.getElementById('chartCurrency').value;
        const timeframe = document.getElementById('timeframe').value;
        const compareCurrency = document.getElementById('compareCurrency').value;
        createChart(currency, timeframe, compareCurrency);
    });

    document.getElementById('timeframe').addEventListener('change', () => {
        const currency = document.getElementById('chartCurrency').value;
        const timeframe = document.getElementById('timeframe').value;
        const compareCurrency = document.getElementById('compareCurrency').value;
        createChart(currency, timeframe, compareCurrency);
    });

    document.getElementById('compareCurrency').addEventListener('change', () => {
        const currency = document.getElementById('chartCurrency').value;
        const timeframe = document.getElementById('timeframe').value;
        const compareCurrency = document.getElementById('compareCurrency').value;
        createChart(currency, timeframe, compareCurrency);
    });


    document.getElementById('closeChart').addEventListener('click', () => {
        document.getElementById('chart-container').style.display = 'none';
        document.getElementById('closeChart').style.display = 'none';
        if (window.currentChart) {
            window.currentChart.destroy();
        }
    });

    // Büyük ekran modu
    document.getElementById('toggleView').addEventListener('click', () => {
        const button = document.getElementById('toggleView');
        const isLargeScreen = document.body.classList.toggle('large-screen-mode');

        if (isLargeScreen) {
            button.innerHTML = '<i class="fas fa-compress"></i> Küçük Ekran';
        } else {
            button.innerHTML = '<i class="fas fa-expand"></i> Büyük Ekran';
        }
    });

    // Grafik görüntüleme
    document.getElementById('timeframe').addEventListener('change', (e) => {
        const chartContainer = document.getElementById('chart-container');
        chartContainer.style.display = 'block';
        createChart('USD');
    });

    // Favoriler butonu
    document.getElementById('showFavorites').addEventListener('click', () => {
        const favoritesBtn = document.getElementById('showFavorites');
        const showingFavorites = favoritesBtn.classList.toggle('active');

        if(showingFavorites) {
            if (!favoriteManager.displayFavorites()) {
                favoritesBtn.classList.remove('active');
            }
        } else {
            displayRates(currentRates);
            showNotification('Tüm para birimleri görüntüleniyor');
        }
    });

    // Rates güncellendiğinde favori ikonlarını güncelle
    document.addEventListener('ratesUpdated', () => {
        favoriteManager.updateIcons();
    });

    setTimeout(updateDateDisplay, 100);
    setTimeout(updateDateDisplay, 1000);
});

let currentRates = {};