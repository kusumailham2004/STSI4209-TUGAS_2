new Vue({
  el: '#app',
  data: {
    appName: 'SITTA Bahan Ajar UT - Manajemen Stok',
    upbjjList: ["Jakarta", "Surabaya", "Makassar", "Padang", "Denpasar"],
    kategoriList: ["MK Wajib", "MK Pilihan", "Praktikum", "Problem-Based"],
    
    // Data Stok Awal (Berdasarkan template dummy data)
    stok: [
      {
        kode: "EKMA4116",
        judul: "Pengantar Manajemen",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A3",
        harga: 65000,
        qty: 28,
        safety: 20,
        catatanHTML: "<em>Edisi 2024, cetak ulang</em>"
      },
      {
        kode: "EKMA4115",
        judul: "Pengantar Akuntansi",
        kategori: "MK Wajib",
        upbjj: "Jakarta",
        lokasiRak: "R1-A4",
        harga: 60000,
        qty: 7,
        safety: 15,
        catatanHTML: "<strong>Cover baru</strong>"
      },
      {
        kode: "BIOL4201",
        judul: "Biologi Umum (Praktikum)",
        kategori: "Praktikum",
        upbjj: "Surabaya",
        lokasiRak: "R3-B2",
        harga: 80000,
        qty: 12,
        safety: 10,
        catatanHTML: "Butuh <u>pendingin</u> untuk kit basah"
      },
      {
        kode: "FISIP4001",
        judul: "Dasar-Dasar Sosiologi",
        kategori: "MK Pilihan",
        upbjj: "Makassar",
        lokasiRak: "R2-C1",
        harga: 55000,
        qty: 2,
        safety: 8,
        catatanHTML: "Stok <i>menipis</i>, prioritaskan reorder"
      }
    ],

    // State Filter & Sorting
    filterUpbjj: '',
    filterKategori: '',
    filterReorder: 'semua', // 'semua' | 'kritis'
    sortBy: 'judul',

    // State Modal & Form Input/Edit
    tampilkanModal: false,
    isEditMode: false,
    formItem: {
      kode: '',
      judul: '',
      kategori: '',
      upbjj: '',
      lokasiRak: '',
      harga: 0,
      qty: 0,
      safety: 0,
      catatanHTML: ''
    },
    formErrors: {},
    notifikasiKritis: false
  },

  computed: {
    // Computed property untuk memfilter dan mengurutkan secara otomatis tanpa recompute berulang
    filteredStok: function () {
      var hasil = this.stok.slice();

      // 1. Filter UT-Daerah
      if (this.filterUpbjj !== '') {
        var daerah = this.filterUpbjj;
        hasil = hasil.filter(function (item) {
          return item.upbjj === daerah;
        });
      }

      // 2. Filter Kategori (Dependent Option)
      if (this.filterKategori !== '') {
        var kat = this.filterKategori;
        hasil = hasil.filter(function (item) {
          return item.kategori === kat;
        });
      }

      // 3. Filter Stok Kritis (qty < safety atau qty === 0)
      if (this.filterReorder === 'kritis') {
        hasil = hasil.filter(function (item) {
          return item.qty < item.safety || item.qty === 0;
        });
      }

      // 4. Sorting Data
      if (this.sortBy === 'judul') {
        hasil.sort(function (a, b) {
          return a.judul.localeCompare(b.judul);
        });
      } else if (this.sortBy === 'qty-asc') {
        hasil.sort(function (a, b) { return a.qty - b.qty; });
      } else if (this.sortBy === 'qty-desc') {
        hasil.sort(function (a, b) { return b.qty - a.qty; });
      } else if (this.sortBy === 'harga-asc') {
        hasil.sort(function (a, b) { return a.harga - b.harga; });
      } else if (this.sortBy === 'harga-desc') {
        hasil.sort(function (a, b) { return b.harga - a.harga; });
      }

      return hasil;
    },

    // Statistik Ringkasan Stok
    totalBuku: function () {
      return this.stok.length;
    },
    totalAman: function () {
      return this.stok.filter(function (item) {
        return item.qty >= item.safety && item.qty > 0;
      }).length;
    },
    totalMenipis: function () {
      return this.stok.filter(function (item) {
        return item.qty < item.safety && item.qty > 0;
      }).length;
    },
    totalKosong: function () {
      return this.stok.filter(function (item) {
        return item.qty === 0;
      }).length;
    }
  },

  watch: {
    // WATCHER 1: Mengatur dependent option filter
    // Jika UT-Daerah diubah atau direset, bersihkan pilihan kategori
    filterUpbjj: function (newVal, oldVal) {
      if (newVal !== oldVal) {
        this.filterKategori = '';
      }
    },

    // WATCHER 2: Memantau perubahan pada daftar stok (deep watcher)
    // Menampilkan pesan notifikasi jika terdapat stok yang menipis atau kosong
    stok: {
      deep: true,
      handler: function (newStokList) {
        var adaKritis = newStokList.some(function (item) {
          return item.qty < item.safety || item.qty === 0;
        });
        if (adaKritis) {
          this.notifikasiKritis = true;
        }
      }
    }
  },

  methods: {
    // Format angka ke format mata uang Rupiah
    formatRupiah: function (nominal) {
      if (typeof nominal !== 'number') return 'Rp 0';
      return 'Rp ' + nominal.toLocaleString('id-ID');
    },

    // Reset seluruh input filter ke nilai awal
    resetFilter: function () {
      this.filterUpbjj = '';
      this.filterKategori = '';
      this.filterReorder = 'semua';
      this.sortBy = 'judul';
    },

    // Buka modal untuk tambah data baru
    bukaModalTambah: function () {
      this.isEditMode = false;
      this.formErrors = {};
      this.formItem = {
        kode: '',
        judul: '',
        kategori: '',
        upbjj: '',
        lokasiRak: '',
        harga: 50000,
        qty: 10,
        safety: 10,
        catatanHTML: ''
      };
      this.tampilkanModal = true;
    },

    // Buka modal untuk mengedit data stok
    bukaModalEdit: function (item) {
      this.isEditMode = true;
      this.formErrors = {};
      // Salin data item ke objek form agar data tabel tidak langsung termutasi sebelum disimpan
      this.formItem = JSON.parse(JSON.stringify(item));
      this.tampilkanModal = true;
    },

    // Validasi input sederhana
    validasiForm: function () {
      var errors = {};
      if (!this.formItem.kode || this.formItem.kode.trim() === '') {
        errors.kode = 'Kode mata kuliah wajib diisi.';
      }
      if (!this.formItem.judul || this.formItem.judul.trim() === '') {
        errors.judul = 'Judul mata kuliah wajib diisi.';
      }
      if (!this.formItem.kategori) {
        errors.kategori = 'Kategori wajib dipilih.';
      }
      if (!this.formItem.upbjj) {
        errors.upbjj = 'UT-Daerah wajib dipilih.';
      }
      if (!this.formItem.lokasiRak || this.formItem.lokasiRak.trim() === '') {
        errors.lokasiRak = 'Lokasi rak wajib diisi.';
      }
      if (this.formItem.harga < 0 || this.formItem.harga === '') {
        errors.harga = 'Harga tidak boleh negatif.';
      }
      if (this.formItem.qty < 0 || this.formItem.qty === '') {
        errors.qty = 'Stok tidak boleh kurang dari 0.';
      }
      if (this.formItem.safety < 0 || this.formItem.safety === '') {
        errors.safety = 'Safety stock tidak boleh kurang dari 0.';
      }

      // Validasi duplikasi kode jika mode tambah baru
      if (!this.isEditMode) {
        var kodeExists = this.stok.some(function (item) {
          return item.kode.toUpperCase() === this.formItem.kode.toUpperCase();
        }.bind(this));
        if (kodeExists) {
          errors.kode = 'Kode mata kuliah sudah terdaftar.';
        }
      }

      this.formErrors = errors;
      return Object.keys(errors).length === 0;
    },

    // Simpan data hasil input atau edit
    simpanBahanAjar: function () {
      if (!this.validasiForm()) return;

      if (this.isEditMode) {
        // Cari index item yang sedang diedit
        var idx = this.stok.findIndex(function (item) {
          return item.kode === this.formItem.kode;
        }.bind(this));

        if (idx !== -1) {
          // Update data menggunakan Vue.set untuk mempertahankan reaktivitas
          Vue.set(this.stok, idx, Object.assign({}, this.formItem));
        }
      } else {
        // Tambahkan bahan ajar baru ke array
        this.stok.push(Object.assign({}, this.formItem, {
          kode: this.formItem.kode.toUpperCase()
        }));
      }

      this.tampilkanModal = false;
    }
  }
});
