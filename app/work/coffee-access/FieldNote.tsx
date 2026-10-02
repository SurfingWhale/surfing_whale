// app/work/coffee-access/FieldNote.tsx
//
// Fauzy's "15 Minutes to Coffee" from the WIP_Projects Notion database,
// rendered as the document it is and kept in the Indonesian he wrote it in.
//
// Two things trimmed, both non-document: the four alternative framings he
// drafted before settling on this one, and the trailing assistant chatter the
// page ends with ("Kalau lo mau, gue bisa bantuin versi berikutnya…"). What
// is left is the article itself, unedited.

export function FieldNote() {
  return (
    <>
      {/* Starts at h2, not h1. This is a document embedded in a case study,
          and the page's own h1 is in CaseHeader — two h1 elements means
          nothing on the page claims to be its subject. Every level inside was
          demoted with it so the outline still steps one at a time. */}
      <h2>☕ 15 Minutes to Coffee</h2>
      <p>
        <strong>Membaca Pola Ruang dan Kelas Sosial di Bintaro</strong>
      </p>
      <blockquote>
        <p>
          Bagi sebagian orang, kopi hanyalah minuman. Tapi di kota besar, kopi
          adalah infrastruktur — dan setiap 15 menit perjalanan menuju kopi
          menceritakan sesuatu tentang siapa kita di ruang kota.
        </p>
      </blockquote>

      <hr />

      <h3>🧭 Latar Belakang</h3>
      <p>Kota selalu berkembang lewat dua hal: mobilitas dan kebiasaan.</p>
      <p>
        Beberapa tahun terakhir, muncul pola menarik di kawasan penyangga
        Jakarta seperti Bintaro — pertumbuhan pesat jaringan kafe cepat saji
        seperti Tomoro Coffee, berdampingan dengan meluasnya perumahan menengah
        ke atas.
      </p>
      <p>
        Fenomena ini bukan kebetulan. Area perumahan kini bukan sekadar tempat
        tinggal, tapi juga pusat ekonomi mikro — dari UMKM, coworking, hingga
        jasa harian. Pertanyaannya:{" "}
        <strong>
          apakah keberadaan kafe modern seperti Tomoro punya pola spasial
          tertentu terhadap perumahan menengah ini?
        </strong>
      </p>

      <h3>🗺️ Tujuan</h3>
      <p>
        Penelitian ringan ini mencoba memetakan hubungan antara jangkauan waktu
        tempuh (isochrone) Tomoro Coffee dengan sebaran perumahan menengah di
        sekitar Bintaro.
      </p>
      <p>
        Tujuannya sederhana: memahami bagaimana akses terhadap ruang gaya hidup
        bisa jadi indikator kelas sosial dan konektivitas urban.
      </p>

      <h3>🧩 Metodologi</h3>
      <h4>1. Data & Sumber</h4>
      <ul>
        <li>
          Lokasi cabang Tomoro Coffee: hasil scraping lokasi dari Google Maps
          & OpenStreetMap.
        </li>
        <li>
          Isochrone 5–10–15 menit: dihasilkan menggunakan API CARTO dengan
          basis data jalan Jabodetabek.
        </li>
        <li>
          Data perumahan: platform Tapera (khusus subsidi) + tag residential di
          OpenStreetMap (untuk non-subsidi).
        </li>
      </ul>
      <h4>2. Analisis</h4>
      <ul>
        <li>
          Layer isochrone Tomoro di-overlay dengan titik perumahan untuk
          mengidentifikasi overlap area.
        </li>
        <li>
          Klasifikasi radius 5, 10, dan 15 menit untuk menentukan zona akses
          kopi.
        </li>
        <li>
          Interpretasi spasial dikaitkan dengan densitas dan karakter ekonomi
          wilayah.
        </li>
      </ul>

      <h3>☕ Temuan Awal</h3>
      <ol>
        <li>
          <strong>
            Sebaran Tomoro padat di zona 10 menit dari perumahan sektor 3–9.
          </strong>{" "}
          Wilayah ini dikenal sebagai kantong perumahan menengah-atas dengan
          aktivitas ekonomi kecil menengah tinggi.
        </li>
        <li>
          <strong>
            Area Ciputat Timur dan Pondok Cabe belum banyak ter-cover.
          </strong>{" "}
          Masih ada perumahan padat tapi tanpa akses kopi modern dalam radius
          15 menit. Ini menandakan potensi ekspansi sekaligus “ketimpangan
          gaya hidup.”
        </li>
        <li>
          <strong>Korelasi antara akses kopi dan mobilitas pribadi.</strong>{" "}
          Mayoritas titik Tomoro berlokasi di sepanjang jalur kendaraan pribadi
          (bukan jalur transportasi publik), menandakan bahwa “akses
          terhadap kopi” masih identik dengan “akses terhadap
          kendaraan.”
        </li>
      </ol>

      <h3>💡 Diskusi</h3>
      <blockquote>
        <p>
          Isochrone bukan cuma tentang jarak — tapi tentang waktu, dan waktu
          adalah kemewahan paling mahal di kota.
        </p>
      </blockquote>
      <p>
        Dari peta yang dihasilkan, terlihat jelas bahwa akses kopi cepat saji
        tidak terdistribusi merata. Ia mengikuti pola konsumsi kelas menengah,
        yang biasanya juga punya mobilitas tinggi dan preferensi waktu efisien.
      </p>
      <p>
        Artinya, ketika kita memetakan kopi, kita sebenarnya sedang memetakan
        kelas dan ritme hidup.
      </p>
      <p>
        Konsep 15-minute city yang populer di Eropa menemukan terjemahannya
        sendiri di Bintaro: bukan soal kedekatan semua fungsi kota, tapi soal
        ketersediaan ruang gaya hidup dalam jarak yang bisa ditempuh tanpa
        kehilangan waktu berharga.
      </p>

      <h3>📍 Kesimpulan</h3>
      <ul>
        <li>
          Pola sebaran Tomoro Coffee menunjukkan adanya clustering spasial di
          area dengan perumahan menengah dan akses jalan utama.
        </li>
        <li>
          Area dengan perumahan padat tapi tanpa cabang Tomoro (seperti Ciputat
          Timur) menjadi indikator “zona under-served” secara gaya
          hidup.
        </li>
        <li>
          Analisis waktu tempuh dapat menjadi alat sederhana namun efektif
          untuk membaca pola sosial dan ekonomi urban.
        </li>
      </ul>

      <h3>🧠 Arah Pengembangan Lanjutan</h3>
      <ul>
        <li>
          Menambahkan data UMKM / GrabFood hotspots untuk menilai dinamika
          ekonomi mikro.
        </li>
        <li>
          Meng-overlay data transportasi publik untuk mengukur keadilan akses
          ruang gaya hidup tanpa kendaraan pribadi.
        </li>
        <li>
          Membuat dashboard interaktif (Mapbox atau Kepler.gl) agar peta dapat
          dieksplor langsung oleh publik.
        </li>
      </ul>

      <h3>✍️ Catatan Penutup</h3>
      <blockquote>
        <p>
          Di Bintaro, kopi bukan cuma urusan kafein. Ia adalah peta waktu —
          menunjukkan siapa yang bisa menukar 15 menitnya untuk gaya hidup, dan
          siapa yang harus menghabiskannya di jalan.
        </p>
      </blockquote>
    </>
  );
}
