// app/work/finance-dashboard/research/ExecutiveSummary.tsx
//
// Fauzy's EXECUTIVE_SUMMARY.md from the Analisa-Finance-App repo, rendered as
// the document it is and kept in the Indonesian he wrote it in.
//
// Unlike the padel summary, every figure survives: all ten charts his notebook
// produced are already in public/research/finance, and the markdown's image
// order maps to them one for one. Nothing here is a placeholder.

const CHART: Record<string, string> = {
  "rating-distribution": "Pola Rating US vs Indonesia",
  "rating-by-app": "Rata-rata Rating per Aplikasi & Market",
  "sentiment-by-app": "Sentimen Pengguna per Aplikasi",
  "sentiment-share": "Proporsi Sentimen per Aplikasi",
  "segment-signal": "Proporsi Review Berdasarkan Sinyal Segmentasi",
  "rating-by-segment": "Avg Rating per Segmen & Market",
  complaints: "Apa yang Paling Dikeluhkan Pengguna",
  praise: "Apa yang Paling Diapresiasi Pengguna",
  "competitive-gap": "Competitive Gap",
  "opportunity-matrix": "Opportunity Matrix",
};

function Fig({ src, alt }: { src: keyof typeof CHART | string; alt: string }) {
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/research/finance/${src}.jpg`} alt={alt} loading="lazy" />
      <figcaption>{CHART[src]}</figcaption>
    </figure>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="doc-table">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, k) => (
                <td key={k}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExecutiveSummary() {
  return (
    <>
      <h1>Executive Summary</h1>
      <p>
        <strong>Riset Pasar Aplikasi Finance — Validasi Segmen Pengguna</strong>
      </p>
      <p>
        <strong>Prepared for:</strong> Surfing Whale Finance
        <br />
        <strong>Periode data:</strong> Maret–April 2026
        <br />
        <strong>Market:</strong> Indonesia (ID) & United States (US)
        <br />
        <strong>Total review dianalisis:</strong> 1.050 (600 ID + 450 US)
      </p>

      <hr />

      <h2>1. Latar Belakang</h2>
      <p>
        Dokumen ini lahir dari sebuah proyek sederhana: saya ingin membangun
        aplikasi pencatatan keuangan, dibantu AI sebagai alat leveragenya.
      </p>
      <p>
        Sebelum mulai membangun, saya memilih untuk riset dulu. Bukan karena
        takut salah, tapi karena saya percaya produk yang baik dimulai dari
        pemahaman yang jujur tentang siapa yang akan memakainya. Pendekatan ini
        yang sering disebut sebagai MVP — <em>Minimum Viable Product</em> — di
        mana kita memvalidasi asumsi sebelum berinvestasi terlalu jauh ke dalam
        pembangunan.
      </p>
      <p>
        Pertanyaan yang ingin saya jawab cukup spesifik:{" "}
        <strong>
          siapa sebenarnya pengguna aplikasi keuangan di Indonesia, dan apa yang
          belum mereka dapatkan dari solusi yang sudah ada?
        </strong>
      </p>
      <p>
        Sebagai lulusan ekonomi yang juga belajar data analysis, saya punya
        hipotesis awal. Saya lumayan paham bagaimana flow akuntansi bekerja, dan
        saya sadar bahwa sebagian besar orang tidak punya bekal itu ketika
        pertama kali mencoba mencatat keuangan sendiri. Di sisi lain, saya juga
        tahu ada orang-orang yang justru tidak butuh aplikasi pencatat keuangan
        mereka sudah punya disiplin mencatatnya sendiri, hanya butuh sistem yang
        tidak mengusik cara kerja mereka.
      </p>
      <p>
        Dari situ muncul dua hipotesis segmen, yang ingin saya validasi lewat
        riset ini menggunakan framework Value Proposition Design (VPD):
      </p>
      <Table
        head={["Segmen", "Hipotesis"]}
        rows={[
          [
            <strong key="a">A — Pencari Efisiensi</strong>,
            "Pengguna yang butuh otomatisasi, konektivitas bank, dan panduan alur keuangan",
          ],
          [
            <strong key="b">B — Pengendali Ketat</strong>,
            "Pengguna yang butuh kontrol manual, jaminan privasi data, dan kemudahan adopsi dari kebiasaan yang sudah ada",
          ],
        ]}
      />
      <p>
        Untuk memvalidasi hipotesis ini, saya menggunakan review Google Play
        Store dari 9 aplikasi pencatat keuangan sebagai sinyal — bukan survei
        yang bisa dimanipulasi, melainkan <em>revealed preference</em> dari
        pengguna nyata yang menulis apa adanya.
      </p>

      <hr />

      <h2>2. Metodologi</h2>
      <ul>
        <li>
          <strong>Sumber data:</strong> Google Play Store (scraping via
          google-play-scraper)
        </li>
        <li>
          <strong>App yang dianalisis:</strong>
          <ul>
            <li>US: YNAB, Wallet (BudgetBakers), Spendee</li>
            <li>
              ID: Jenius/Moneytory, Wallet, Money Lover, Bluecoins, Monefy,
              Spendee
            </li>
          </ul>
        </li>
        <li>
          <strong>Metode analisis:</strong>
          <ul>
            <li>Sentiment scoring per review (skala -1.0 hingga +1.0)</li>
            <li>Keyword mapping ke dua segmen VPD</li>
            <li>Pain point frequency dari review bintang 1–2</li>
            <li>Competitive gap matrix per kategori masalah</li>
          </ul>
        </li>
      </ul>

      <hr />

      <h2>3. Gambaran Pasar: US vs Indonesia</h2>
      <p>
        Kedua pasar menunjukkan pola yang <strong>berbeda signifikan</strong>{" "}
        dalam distribusi rating.
      </p>
      <Fig
        src="rating-distribution"
        alt="Rating distribution for the US and Indonesian markets: the US concentrates at one and five stars, Indonesia spreads across three and four."
      />
      <p>
        <strong>Temuan:</strong>
      </p>
      <ul>
        <li>
          Pasar <strong>US</strong> lebih terpolarisasi — bintang 1 dan 5
          mendominasi. Pengguna US langsung meninggalkan app yang tidak sesuai
          ekspektasi, dan sangat vokal.
        </li>
        <li>
          Pasar <strong>ID</strong> lebih menyebar — banyak bintang 3–4,
          menunjukkan toleransi lebih tinggi atau ekspektasi yang lebih rendah.
        </li>
        <li>
          Rata-rata rating US lebih tinggi secara agregat, tapi sentimen negatif
          lebih tajam ketika muncul.
        </li>
      </ul>

      <hr />

      <h2>4. Performa Kompetitor</h2>
      <h3>4.1 Rating per Aplikasi</h3>
      <Fig
        src="rating-by-app"
        alt="Average rating per application in each market."
      />
      <p>
        <strong>
          Note: Jenius disertakan dalam analisis ini meskipun secara teknis
          adalah aplikasi perbankan. Tujuannya adalah untuk memetakan standar
          ekspektasi pengguna lokal terhadap platform yang mengelola dana
          mereka.
        </strong>
      </p>
      <p>
        <strong>Ranking berdasarkan avg rating (ID market):</strong>
      </p>
      <ol>
        <li>
          <strong>Monefy</strong> — tertinggi, UI simpel, keluhan sangat minim
        </li>
        <li>
          <strong>Bluecoins</strong> — solid, cocok untuk power user
        </li>
        <li>
          <strong>Money Lover</strong> — mid-tier, UX mulai dikomplain
        </li>
        <li>
          <strong>Wallet (BudgetBakers)</strong> — fitur kuat, tapi absennya
          Bahasa Indonesia jadi batu sandungan besar
        </li>
        <li>
          <strong>Spendee</strong> — tampilan menarik, tapi sering crash dan
          lambat
        </li>
        <li>
          <strong>Jenius / Moneytory</strong> — paling banyak keluhan, kategori
          berbeda (banking app bukan budgeting tool murni)
        </li>
      </ol>

      <h3>4.2 Sentimen per Aplikasi</h3>
      <Fig src="sentiment-by-app" alt="Sentiment scores per application." />
      <Fig
        src="sentiment-share"
        alt="Share of positive, neutral and negative sentiment per application."
      />
      <p>
        Monefy dan Bluecoins secara konsisten menunjukkan sentimen positif di
        atas rata-rata. Jenius memiliki sentimen negatif tertinggi — mayoritas
        keluhan bukan soal fitur budgeting, melainkan infrastruktur banking
        (login error, QRIS mati, CS tidak responsif).
      </p>

      <hr />

      <h2>5. Validasi Segmentasi VPD</h2>
      <h3>5.1 Distribusi Sinyal Segmen</h3>
      <Fig
        src="segment-signal"
        alt="Proportion of reviews carrying signals for each segment, split by market."
      />
      <p>Dari total review yang terklasifikasi:</p>
      <ul>
        <li>
          <strong>Segmen A (Efisiensi)</strong> mendominasi di pasar US —
          pengguna sangat vokal soal bank sync, onboarding, dan workflow.
        </li>
        <li>
          <strong>Segmen B (Pengendali Ketat)</strong> lebih menonjol di pasar
          ID — keyword privasi, kemudahan, dan kontrol manual lebih sering
          muncul.
        </li>
        <li>
          Kedua segmen <strong>nyata</strong> dan berbeda secara statistik —
          hipotesis VPD terkonfirmasi.
        </li>
      </ul>

      <h3>5.2 Perbedaan Pain Level antar Segmen</h3>
      <Fig
        src="rating-by-segment"
        alt="Average rating given by each segment in each market; segment A rates consistently lower."
      />
      <p>
        Segmen A secara konsisten memberikan rating lebih rendah dari Segmen B.
        Artinya:
      </p>
      <blockquote>
        <p>
          Pengguna yang butuh efisiensi & otomatisasi{" "}
          <strong>lebih tidak puas</strong> dengan solusi yang ada dibanding
          pengguna yang butuh simplisitas.
        </p>
      </blockquote>
      <p>
        Ini adalah sinyal kuat bahwa{" "}
        <strong>Segmen A menyimpan frustrasi yang belum terpecahkan</strong> —
        gap yang bisa diisi.
      </p>

      <hr />

      <h2>6. Pain Points Utama</h2>
      <h3>6.1 Apa yang Paling Dikeluhkan</h3>
      <Fig src="complaints" alt="Most frequent complaints across reviews." />
      <Table
        head={["Keluhan", "US", "ID"]}
        rows={[
          ["Learning curve / onboarding ribet", "Sangat tinggi (YNAB)", "Tinggi"],
          ["Harga / subscription mahal", "Tinggi", "Sedang"],
          ["Bank sync tidak stabil", "Tinggi", "Rendah"],
          ["Bug / crash / lambat", "Sedang", "Sangat tinggi"],
          ["Tidak ada Bahasa Indonesia", "N/A", "Tinggi (BudgetBakers, Spendee)"],
          ["Biaya tersembunyi", "Rendah", "Tinggi (Jenius)"],
        ]}
      />

      <h3>6.2 Apa yang Paling Diapresiasi</h3>
      <Fig src="praise" alt="Most frequent words in positive reviews." />
      <p>
        Kata yang paling konsisten muncul di review positif lintas pasar:{" "}
        <strong>mudah</strong>, <strong>simpel</strong>, <strong>gratis</strong>,{" "}
        <strong>membantu</strong>, <strong>fitur lengkap</strong>. Pengguna
        menghargai simplisitas lebih dari fitur canggih yang sulit dipakai.
      </p>

      <hr />

      <h2>7. Competitive Gap Analysis</h2>
      <Fig
        src="competitive-gap"
        alt="Matrix of how often each competitor fails in each problem category."
      />
      <p>
        Matriks ini menunjukkan di mana setiap kompetitor{" "}
        <strong>gagal paling sering</strong> berdasarkan kategori masalah:
      </p>
      <ul>
        <li>
          <strong>Onboarding/UX</strong>: YNAB paling parah di US — banyak
          pengguna menyerah sebelum paham cara kerja app.
        </li>
        <li>
          <strong>Bug/Performa</strong>: Spendee dan Jenius memimpin keluhan di
          kategori ini — kepercayaan erosi cepat.
        </li>
        <li>
          <strong>Harga</strong>: YNAB mahal untuk segmen bawah; BudgetBakers
          dikomplain soal premium tidak aktif setelah bayar.
        </li>
        <li>
          <strong>Privasi/Data</strong>: Keluhan kecil tapi ada — terutama di
          Jenius (kebocoran data, notifikasi transaksi terlambat).
        </li>
      </ul>
      <p>
        <strong>
          Gap terbesar yang belum diisi oleh satupun kompetitor:
        </strong>{" "}
        onboarding terstruktur dengan konteks finansial lokal Indonesia.
      </p>

      <hr />

      <h2>8. Opportunity Matrix</h2>
      <Fig
        src="opportunity-matrix"
        alt="Urgency of each feature for each segment, scored one to five."
      />
      <p>Skala urgensi 1–5 per fitur per segmen:</p>
      <Table
        head={["Fitur", "Segmen A", "Segmen B"]}
        rows={[
          ["Privacy & Security", "3", "5"],
          ["Guided Onboarding / Finance 101", "5", "2"],
          ["Flow Akuntansi Terstruktur", "5", "3"],
          ["Kemudahan Migrasi dari Manual", "4", "5"],
        ]}
      />
      <p>
        <strong>Takeaway</strong>: Tidak ada satu fitur yang bisa melayani kedua
        segmen sekaligus. Produk perlu{" "}
        <strong>mode atau entry path yang berbeda</strong> per segmen sejak
        onboarding.
      </p>

      <hr />

      <h2>9. Rekomendasi Strategis</h2>
      <h3>Untuk Segmen A — Si Pencari Efisiensi</h3>
      <p>
        <strong>Problem nyata:</strong> Tidak ada yang mengajarkan{" "}
        <em>cara berpikir keuangan</em> sebelum meminta input data.
      </p>
      <p>
        <strong>Rekomendasi:</strong>
      </p>
      <ul>
        <li>
          Built-in <strong>Finance 101</strong> — modul singkat sebelum user
          pertama kali pakai app (opsional tapi default aktif)
        </li>
        <li>
          Template kategori siap pakai berdasarkan profil (mahasiswa, karyawan,
          freelancer)
        </li>
        <li>
          Tooltip kontekstual di setiap field — bukan help center, tapi
          penjelasan inline
        </li>
        <li>
          Onboarding progress bar yang jelas — user tahu berapa langkah lagi
          sampai “siap pakai”
        </li>
      </ul>

      <h3>Untuk Segmen B — Si Pengendali Ketat</h3>
      <p>
        <strong>Problem nyata:</strong> Tidak percaya data aman, dan transisi
        dari buku manual terasa ribet.
      </p>
      <p>
        <strong>Rekomendasi:</strong>
      </p>
      <ul>
        <li>
          <strong>Privacy-first messaging</strong> yang eksplisit di onboarding
          — bukan hanya checkbox ToS
        </li>
        <li>
          Wizard migrasi manual: foto struk → auto-parse → konfirmasi (tanpa
          perlu ketik ulang)
        </li>
        <li>
          Mode offline sebagai <strong>trust signal utama</strong> — bukan
          sekadar fitur tambahan
        </li>
        <li>
          UI minimal dengan opsi “tampilan kasir” — catat cepat
          tanpa perlu navigasi menu dalam
        </li>
      </ul>

      <h3>Must-have Cross-Segment (Hygiene Factors)</h3>
      <ul>
        <li>
          Full <strong>Bahasa Indonesia</strong> dari hari pertama (langsung
          eliminasi kelemahan BudgetBakers & Spendee)
        </li>
        <li>
          Login <strong>biometric</strong> sebagai default — bukan PIN
          (eliminasi keluhan terbesar Jenius)
        </li>
        <li>
          <strong>Zero surprise fees</strong> — tidak ada potongan saldo tanpa
          notifikasi eksplisit
        </li>
        <li>
          CS responsif <strong>di dalam app</strong> — bukan redirect ke WA atau
          Zoom
        </li>
      </ul>

      <hr />

      <h2>10. Kesimpulan</h2>
      <p>
        Pasar aplikasi keuangan Indonesia{" "}
        <strong>belum punya pemimpin yang kuat</strong> di segmen budgeting
        murni. Monefy dan Bluecoins memimpin rating, tapi keduanya tidak punya
        amunisi untuk edukasi pengguna atau positioning premium.
      </p>
      <p>
        Surfing Whale Finance punya <strong>jendela masuk yang jelas</strong>:
      </p>
      <ol>
        <li>
          Kompetitor terkuat di fitur (YNAB, BudgetBakers) lemah di lokalisasi
          dan onboarding.
        </li>
        <li>
          Kompetitor lokal terkuat (Jenius) bukan budgeting app — klien salah
          kategori produk.
        </li>
        <li>
          Segmen A (Efisiensi) paling frustrasi dan paling aktif menulis review
          — mereka sedang mencari.
        </li>
        <li>
          Segmen B (Pengendali Ketat) loyal jika trust terbentuk di awal —
          switching cost tinggi setelah adopt.
        </li>
      </ol>
      <p>
        <strong>Positioning yang direkomendasikan:</strong>
      </p>
      <blockquote>
        <p>
          <strong>Segmen A:</strong>{" "}
          <em>
            “Sistem keuangan lengkap untuk yang mau belajar, bukan sekadar
            catat”
          </em>
        </p>
        <p>
          <strong>Segmen B:</strong>{" "}
          <em>
            “Data kamu, kontrol kamu — sesimpel buku catatan, sepintar
            spreadsheet”
          </em>
        </p>
      </blockquote>

      <hr />

      <p>
        <em>
          Surfing Whale Finance — Internal Research Document · April 2026
        </em>
      </p>
    </>
  );
}
