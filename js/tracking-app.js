new Vue({
  el: '#app',
  data: {
    // Data rujukan berdasarkan template dummy data
    pengirimanList: [
      { kode: "REG", nama: "Reguler (3-5 hari)" },
      { kode: "EXP", nama: "Ekspres (1-2 hari)" }
    ],
    paket: [
      { kode: "PAKET-UT-001", nama: "PAKET IPS Dasar", isi: ["EKMA4116", "EKMA4115"], harga: 120000 },
      { kode: "PAKET-UT-002", nama: "PAKET IPA Dasar", isi: ["BIOL4201", "FISIP4001"], harga: 140000 }
    ],

    // Data tracking simulasi awal
    tracking: {
      "DO2025-0001": {
        nim: "123456789",
        nama: "Rina Wulandari",
        status: "Dalam Perjalanan",
        ekspedisi: "Reguler (3-5 hari)",
        tanggalKirim: "2025-08-25",
        paket: "PAKET-UT-001",
        total: 120000,
        perjalanan: [
          { waktu: "2025-08-25 10:12:20", keterangan: "Penerimaan di Loket: TANGSEL" },
          { waktu: "2025-08-25 14:07:56", keterangan: "Tiba di Hub: JAKSEL" },
          { waktu: "2025-08-26 08:44:01", keterangan: "Diteruskan ke Kantor Tujuan" }
        ]
      }
    },

    // Form Input DO Baru
    formDO: {
      nim: '',
      nama: '',
      ekspedisi: '',
      paketKode: '',
      tanggalKirim: new Date().toISOString().split('T')[0], // Default tanggal hari ini (YYYY-MM-DD)
      total: 0
    },
    formErrors: {},
    notifSukses: false,
    doTerakhir: '',

    // State Pelacakan
    cariDO: '',
    nomorAktif: '',
    hasilTracking: null,
    sudahMencari: false
  },

  computed: {
    // Menghasilkan nomor DO otomatis: DO + Tahun Berjalan + Sequence Number
    generateNomorDO: function () {
      var tahun = new Date().getFullYear();
      var prefix = "DO" + tahun + "-";
      
      // Ambil seluruh nomor DO yang ada pada tracking data
      var keys = Object.keys(this.tracking);
      var count = keys.length + 1;
      
      // Format 4 digit: 0001, 0002, dst.
      var seq = ("0000" + count).slice(-4);
      return prefix + seq;
    },

    // Mengambil detail objek paket terpilih untuk menampilkan rincian buku
    detailPaketTerpilih: function () {
      if (!this.formDO.paketKode) return null;
      var kode = this.formDO.paketKode;
      return this.paket.find(function (p) {
        return p.kode === kode;
      }) || null;
    }
  },

  watch: {
    // WATCHER 1: Memantau perubahan pilihan paket bahan ajar
    // Otomatis memperbarui harga total form berdasarkan paket terpilih
    'formDO.paketKode': function (newKode) {
      if (!newKode) {
        this.formDO.total = 0;
        return;
      }
      var target = this.paket.find(function (p) {
        return p.kode === newKode;
      });
      if (target) {
        this.formDO.total = target.harga;
      }
    },

    // WATCHER 2: Memantau input nomor pencarian DO
    // Otomatis mengubah teks ke huruf besar dan menghapus spasi berlebih
    cariDO: function (newVal) {
      if (newVal) {
        this.cariDO = newVal.toUpperCase().replace(/\s+/g, '');
      }
    }
  },

  methods: {
    // Format angka ke format Rupiah
    formatRupiah: function (nominal) {
      if (typeof nominal !== 'number') return 'Rp 0';
      return 'Rp ' + nominal.toLocaleString('id-ID');
    },

    // Validasi input data Delivery Order baru
    validasiDO: function () {
      var errors = {};
      if (!this.formDO.nim || this.formDO.nim.trim().length < 8) {
        errors.nim = 'NIM minimal harus terdiri dari 8 karakter angka.';
      }
      if (!this.formDO.nama || this.formDO.nama.trim() === '') {
        errors.nama = 'Nama mahasiswa wajib diisi.';
      }
      if (!this.formDO.ekspedisi) {
        errors.ekspedisi = 'Pilih layanan ekspedisi.';
      }
      if (!this.formDO.paketKode) {
        errors.paketKode = 'Pilih salah satu paket bahan ajar.';
      }
      if (!this.formDO.tanggalKirim) {
        errors.tanggalKirim = 'Tanggal kirim tidak boleh kosong.';
      }

      this.formErrors = errors;
      return Object.keys(errors).length === 0;
    },

    // Simpan DO baru ke dalam data tracking
    simpanDO: function () {
      if (!this.validasiDO()) return;

      var nomorBaru = this.generateNomorDO;
      var ekspedisiObj = this.pengirimanList.find(function (e) {
        return e.kode === this.formDO.ekspedisi;
      }.bind(this));

      // Bentuk data tracking baru dengan log perjalanan perdana
      var now = new Date();
      var waktuStr = now.toISOString().replace('T', ' ').substring(0, 19);

      var dataBaru = {
        nim: this.formDO.nim,
        nama: this.formDO.nama,
        status: "Diproses di Gudang UT Pusat",
        ekspedisi: ekspedisiObj ? ekspedisiObj.nama : this.formDO.ekspedisi,
        tanggalKirim: this.formDO.tanggalKirim,
        paket: this.formDO.paketKode,
        total: this.formDO.total,
        perjalanan: [
          { waktu: waktuStr, keterangan: "Order dibuat dan dicetak oleh SITTA Pusat" },
          { waktu: waktuStr, keterangan: "Paket siap diambil oleh kurir ekspedisi" }
        ]
      };

      // Simpan menggunakan Vue.set untuk menjaga reaktivitas objek
      Vue.set(this.tracking, nomorBaru, dataBaru);

      this.doTerakhir = nomorBaru;
      this.notifSukses = true;

      // Reset formulir input
      this.formDO = {
        nim: '',
        nama: '',
        ekspedisi: '',
        paketKode: '',
        tanggalKirim: new Date().toISOString().split('T')[0],
        total: 0
      };
      this.formErrors = {};

      // Langsung tampilkan hasil tracking dari DO yang baru dibuat
      this.cariDO = nomorBaru;
      this.lacakDO();
    },

    // Mencari nomor DO dari data tracking
    lacakDO: function () {
      this.sudahMencari = true;
      if (!this.cariDO) {
        this.hasilTracking = null;
        return;
      }

      if (this.tracking[this.cariDO]) {
        this.hasilTracking = this.tracking[this.cariDO];
        this.nomorAktif = this.cariDO;
      } else {
        this.hasilTracking = null;
      }
    }
  }
});
