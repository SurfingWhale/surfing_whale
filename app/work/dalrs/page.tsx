// app/work/dalrs/page.tsx
//
// DALRS, written up from three sources: the repository SurfingWhale/dalrs at
// a9a677e, its design artifact, and screenshots taken from the app running
// locally in demo mode (without VITE_FIREBASE_API_KEY it serves its own
// in-browser sample data, which is what these show — no real records).
//
// THE PAGE IS IN INDONESIAN and every other page on this site is in English.
// That is deliberate and it was asked for: DALRS is an Indonesian product,
// its artifact and its whole interface are in Indonesian, and translating
// "serah terima" and "BAST" would have been translating the subject. The
// <article> carries lang="id" so a screen reader says it in Indonesian rather
// than reading it with English phonemes, and the JSON-LD says id-ID.
//
// ONE NUMBER FROM THE BRIEF IS NOT HERE. It asked for "tap->frame ~40 ms".
// docs/native-audit.md lists K7 (tap to next frame) under "Not measured yet",
// and the standard's own target is p75 under 100 ms. Section 06 says that
// instead. A page whose argument is that the controls were measured cannot
// carry a measurement nobody took.
import type { Metadata } from "next";
import Link from "next/link";
import { CaseHeader } from "@/app/components/CaseHeader";
import { ReadBlock, ReadNav, ReadPage, ReadSection } from "@/app/components/Read";
import { ReelPlayer } from "@/app/components/ReelPlayer";
import { ShareRow } from "@/app/components/ShareRow";
import { JsonLd, articleGraph, breadcrumbs } from "@/app/lib/schema";
import { SITE } from "@/app/lib/site";
import "./dalrs.css";

const TITLE = "DALRS — Tahu siapa memegang setiap barang, setiap saat.";
const DESCRIPTION =
  "Sistem siklus hidup aset dan rekonsiliasi untuk gudang dan kantor kecil: setiap barang punya satu catatan dan satu pemegang, serah terima lewat persetujuan dan BAST, dan stok opname bulanan yang menandai selisihnya sebagai exception.";

export const metadata: Metadata = {
  alternates: { canonical: "/work/dalrs" },
  title: `${TITLE} — Surfing Whale`,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "article",
    locale: "id_ID",
    images: [{ url: "/work/dalrs/og.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: { card: "summary_large_image", images: ["/work/dalrs/og.png"] },
};

const linkish =
  "font-medium text-fg underline decoration-border-strong underline-offset-[3px] hover:decoration-[var(--accent-soft)] transition-colors duration-200";

// Intrinsic sizes, so nothing reflows as the figures arrive.
const SHOT: Record<string, [number, number]> = {
  "app-landing": [2560, 1520],
  "app-movements": [2560, 1240],
  "app-reconciliation": [2560, 1320],
  "app-dashboard": [2560, 1520],
  "app-movements-phone": [780, 1688],
  "app-dashboard-phone": [780, 1688],
};
const CAP: Record<string, number> = { "app-movements-phone": 300, "app-dashboard-phone": 300 };

function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  const [w, h] = SHOT[src] ?? [2560, 1400];
  const cap = CAP[src];
  return (
    <figure className="my-6" style={cap ? { maxWidth: cap } : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/work/dalrs/${src}.webp`}
        alt={alt}
        width={w}
        height={h}
        loading="lazy"
        className="w-full h-auto block bg-white border border-border rounded-lg"
      />
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2">{caption}</figcaption>
    </figure>
  );
}

function Iso({ src, alt, caption, max }: { src: string; alt: string; caption: string; max?: number }) {
  return (
    <figure className="my-6" style={max ? { maxWidth: max } : undefined}>
      <div className="dalrs-quote">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/work/dalrs/${src}.svg`} alt={alt} className="w-full h-auto block" />
      </div>
      <figcaption className="text-[11px] leading-[1.7] text-fg-muted mt-2">{caption}</figcaption>
    </figure>
  );
}

function Rows({ head, rows }: { head: [string, string]; rows: [string, string][] }) {
  return (
    <div className="my-6 border-t border-border-strong">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4 py-2 border-b border-border">
        {head.map((h) => (
          <span key={h} className="text-[11px] font-medium uppercase tracking-[0.14em] leading-[1.5] text-fg-label">{h}</span>
        ))}
      </div>
      {rows.map(([a, b]) => (
        <div key={a} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-4 py-2 border-b border-border">
          <span className="leading-[1.8] text-fg">{a}</span>
          <span className="leading-[1.8] text-fg-body">{b}</span>
        </div>
      ))}
    </div>
  );
}

// Every figure is from docs/evaluation.md and the property test, at a9a677e.
const STATS: [string, string][] = [
  ["20.455", "cacat disisipkan ke 90 spreadsheet sintetis"],
  ["99,99%", "ditemukan, bahkan saat datanya 3× lebih berantakan"],
  ["0,9 dtk", "untuk menelusuri histori satu barang"],
  ["3.000", "alur acak per pengujian, tanpa satu pun custody bocor"],
];

const CHAIN: [string, string, boolean][] = [
  ["#41", "a3f9…", false],
  ["#42", "7c10…", false],
  ["#43", "e4d2…", true],
  ["#44", "91bb…", false],
];

export default function DalrsPage() {
  return (
    <ReadPage>
      <JsonLd data={articleGraph({ headline: TITLE, description: DESCRIPTION, url: `${SITE}/work/dalrs`, inLanguage: "id-ID" })} />
      <JsonLd data={breadcrumbs([{ name: "Work", path: "/" }, { name: "DALRS", path: "/work/dalrs" }])} />

      <ReadNav share={{ url: `${SITE}/work/dalrs`, title: TITLE }} />

      <article className="py-16 dalrs" lang="id">
        <ReadBlock>
          <CaseHeader
            scale="display"
            kicker="Produk · Okt 2026"
            title="DALRS"
            facts={["Produk + build", "PWA · Indonesia", "2026"]}
            claim="Tahu siapa memegang setiap barang, setiap saat — untuk gudang dan kantor kecil, di mana aset berpindah tangan jauh lebih sering daripada catatannya diperbarui."
            made={[
              { label: "Peran", value: "Produk, desain, dan full-stack" },
              { label: "Stack", value: "React 19 + Vite PWA; paket domain TypeScript dengan Vitest dan property test; Firebase — Firestore Jakarta, Auth Google, Cloud Functions v2, security rules; Playwright di Chromium dan WebKit iPhone; Three.js; Vercel; GitHub Actions" },
              { label: "Diuji", value: "20.455 cacat sintetis terhadap kunci jawaban; 3.000 alur acak per pengujian property-based; audit standar native di WebKit iPhone 12" },
              { label: "Sumber", value: "Repositori SurfingWhale/dalrs pada commit a9a677e, dan dokumen docs/evaluation.md serta docs/native-audit.md di dalamnya" },
            ]}
          />
        </ReadBlock>

        <ReadBlock>
          <ReelPlayer
            poster="/work/dalrs/reel-poster.webp"
            posterSmall="/work/dalrs/reel-poster-960.webp"
            mp4="/work/dalrs/reel.mp4"
            seconds={30}
            label="Film DALRS: gudang isometrik yang menyusun diri, gerbang scan, empat langkah serah terima, rantai audit yang putus, lalu angka buktinya."
          >
            Tiga puluh detik, enam adegan: lantai gudang menyusun diri, satu
            kardus lewat gerbang scan G-1, empat langkah serah terima dengan
            satu titik di mana pemegang benar-benar berganti, rantai audit yang
            putus tepat di baris yang diubah, lalu angka buktinya. Dibuat dengan
            Remotion — komposisinya ada di{" "}
            <code className="font-mono text-[11px]">app/remotion/</code> dan
            berjalan langsung di React, bukan sebagai berkas video, jadi tetap
            tajam di lebar berapa pun. Tanpa suara.
          </ReelPlayer>
        </ReadBlock>

        <ReadSection number="01" title="Datanya ada. Yang tidak ada: siapa yang memegangnya sekarang.">
          <p>
            Di gudang dan kantor kecil, barang berpindah tangan jauh lebih sering
            daripada catatannya diperbarui. Laptop dipinjam rekan sebelah, scanner
            dibawa ke site lain, tablet stok opname ikut orang yang sudah resign
            tiga minggu lalu. Spreadsheet-nya masih ada, dan isinya masih benar —
            untuk keadaan bulan lalu.
          </p>
          <p>
            Yang hilang bukan nama barangnya. Yang hilang posisinya: siapa
            memegang, sejak kapan, atas dasar apa. Dan karena tidak ada bukti
            serah terima, tidak ada yang bisa ditunjuk ketika barangnya tidak
            ketemu — yang tersisa cuma saling ingat.
          </p>
          <Iso
            src="iso-warehouse"
            alt="Gambar isometrik gudang: rak B-02 berisi kardus, konveyor dengan kardus di atasnya, palet, dan scanner tangan yang menembakkan sinar kuning ke stiker bertuliskan AST-000123."
            caption="Gambar isometrik dari aplikasinya sendiri — dibangkitkan dari apps/web/src/iso.ts, satu proyeksi yang sama untuk semua ilustrasi di DALRS. Animasinya sengaja dibekukan di sini; yang bergerak ada di film di atas."
          />
        </ReadSection>

        <ReadSection number="02" title="Empat hal, dan hanya satu yang memindahkan custody">
          <p>
            DALRS mengerjakan empat hal. Urutannya penting, karena justru di
            urutan itulah sistem ini berbeda dari daftar inventaris biasa.
          </p>
          <Rows
            head={["Bagian", "Yang dikerjakan"]}
            rows={[
              ["Registry", "Setiap barang dapat satu ID aset. Serial yang persis sama ditolak; yang mirip (Z dan 2, O dan 0) ditahan untuk dicek fisik, tidak diam-diam digabung."],
              ["Serah terima", "Ajukan → setujui → BAST → pemegang berganti. Satu titik, sekali, dengan bukti."],
              ["Jejak audit", "Setiap kejadian menyimpan hash kejadian sebelumnya, ditulis satu transaksi bersama perubahannya."],
              ["Rekonsiliasi", "Sebulan sekali semua barang dicek fisik. Yang beda jadi exception, dan koreksinya menyimpan nilai lama, siapa yang mengoreksi, dan alasannya."],
            ]}
          />
          <p>
            Yang paling mudah salah dirancang adalah yang kedua. Pemegang resmi
            tidak berganti saat barangnya diserahkan, dan tidak berganti saat
            permintaannya disetujui — tapi saat penerima mengonfirmasi dengan
            BAST yang valid. Sebelum titik itu, barangnya masih tercatat di
            tangan yang lama, sekalipun fisiknya sudah pindah.
          </p>
          <Shot
            src="app-movements"
            alt="Layar Serah terima: pemilih peran simulasi, formulir ajuan perpindahan dengan barang, kepada, dan lokasi tujuan, lalu daftar permintaan dan jejak audit sesi ini."
            caption="Layar serah terima, data contoh. Pemilih peran di atas ada supaya satu orang bisa mencoba seluruh alurnya — dan membenturkannya ke aturan, misalnya menyetujui permintaannya sendiri."
          />
        </ReadSection>

        <ReadSection number="03" title="Kontrolnya ada di database, bukan di tampilan">
          <p>
            Tombol yang disembunyikan bukan izin. Semua aturan di bawah ini
            ditegakkan di{" "}
            <code className="font-mono text-[12px]">firestore.rules</code> dan di
            Cloud Functions, dan masing-masing punya tes yang gagal kalau
            kontrolnya bocor.
          </p>
          <Rows
            head={["Kontrol", "Cara menegakkannya"]}
            rows={[
              ["Pemisahan tugas", "Pemohon tidak bisa menyetujui permintaannya sendiri, dan approver hanya bertindak di regionnya"],
              ["Akses per region", "Security rules membatasi baca per region — PIC Jakarta tidak melihat barang Bandung, bahkan lewat API"],
              ["Klien hanya membaca", "Browser tidak pernah menulis ke database; semua perubahan lewat Cloud Functions"],
              ["Bukti tidak bisa ditimpa", "Storage rules: allow create hanya kalau resource == null, jadi BAST dan foto tidak bisa diganti"],
            ]}
          />
          <p>
            Yang terakhir itu ketemu lewat tes, bukan lewat review. Di Firebase
            Storage, menimpa berkas yang sudah ada dievaluasi sebagai{" "}
            <code className="font-mono text-[12px]">create</code>, bukan{" "}
            <code className="font-mono text-[12px]">update</code> — jadi aturan
            yang kelihatannya sudah benar tetap mengizinkan bukti ditimpa.
          </p>
          <Iso
            src="iso-layers"
            alt="Tiga lapisan bertumpuk secara isometrik: aplikasi web di atas, cloud functions di tengah, lalu lapisan gelap bertuliskan Firestore · Jakarta di bawah."
            caption="Tiga lapisan, satu tugas masing-masing. Lapisan paling bawah yang gelap itu satu-satunya yang boleh menulis."
            max={330}
          />
        </ReadSection>

        <ReadSection number="04" title="Rantai yang putus tepat di baris yang diubah">
          <p>
            Setiap kejadian — barang didaftarkan, permintaan disetujui, custody
            berpindah — menyimpan hash kejadian sebelumnya. Mengubah satu baris
            lama berarti hash-nya tidak lagi cocok dengan yang disimpan baris
            berikutnya, dan rantainya putus persis di baris itu, bukan di
            ujungnya.
          </p>
          <p>
            Itu tidak mencegah orang mengubah data. Yang dilakukannya lebih
            sederhana dan lebih berguna: membuat perubahan itu tidak bisa
            disembunyikan.
          </p>
          <div className="dalrs-quote my-6">
            <p className="lbl">Jejak audit</p>
            <div className="dalrs-mono mt-3 flex items-center gap-2 overflow-x-auto text-[12px]">
              {CHAIN.map(([n, h, broken], i) => (
                <div key={n} className="flex items-center gap-2">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="block h-[2px] w-5 shrink-0"
                      style={
                        i >= 2
                          ? { borderTop: "2px dashed #000", opacity: 0.5 }
                          : { background: "#000" }
                      }
                    />
                  )}
                  <span
                    className="shrink-0 rounded-lg px-3 py-2"
                    style={{
                      border: `${broken ? 2 : 1}px solid #000`,
                      background: broken ? "rgba(0,0,0,.05)" : "#fff",
                    }}
                  >
                    <b className="block font-semibold">{n}</b>
                    <span style={{ color: "#5b6068" }}>{h}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="lbl mt-3">#43 diubah · rantai putus di sini</p>
          </div>
        </ReadSection>

        <ReadSection number="05" title="Diukur terhadap kunci jawaban, bukan terhadap selera">
          <p>
            Pertanyaan yang sebenarnya bukan &ldquo;apakah tampilannya
            benar&rdquo;, tapi &ldquo;apakah rekonsiliasinya menemukan yang
            memang salah&rdquo;. Jadi sistemnya diadu dengan spreadsheet warisan
            sintetis: generator menyisipkan typo serial, baris duplikat, aset
            hantu, perangkat tak terdaftar, pemegang basi, lokasi salah, kondisi
            yang berubah, dan BAST yang hilang — lalu mencatat setiap satu
            sebagai kunci jawaban. Detektornya tidak pernah melihat kunci itu.
          </p>
          <div className="dalrs-stats my-6">
            {STATS.map(([v, l]) => (
              <div key={l} className="dalrs-stat">
                <b>{v}</b>
                <span>{l}</span>
              </div>
            ))}
          </div>
          <p>
            Pada tingkat cacat normal, semua jenis ketemu 100% — presisi dan
            recall. Saat tingkatnya dinaikkan 3×, angkanya turun jadi 99,99%:
            satu luput dari 9.867, dan luputnya pun masih dilaporkan, hanya
            dengan label yang salah. Barang itu kena dua cacat sekaligus (typo
            transposisi <em>dan</em> duplikat yang kehilangan satu karakter),
            jadi kedua barisnya berjarak dua edit dan muncul sebagai aset hantu,
            bukan sebagai duplikat.
          </p>
          <p>
            Angka-angka ini{" "}
            <strong className="font-medium text-fg">in-sample</strong>, dan
            dokumen evaluasinya menulis itu lebih dulu sebelum menulis hasilnya.
            Detektornya dikembangkan terhadap generator yang sama, jadi yang
            dibuktikan adalah &ldquo;menangani setiap cacat sebagaimana
            dimodelkan&rdquo;, bukan &ldquo;akan dapat 100% di data
            sungguhan&rdquo;. Uji berikutnya yang benar-benar berarti adalah
            dataset yang dibuat orang lain, dinilai sekali tanpa penyetelan.
          </p>
          <p>
            Evaluasi itu juga yang mengubah sistemnya, bukan sekadar menilainya.
            Pada run pertama presisi{" "}
            <code className="font-mono text-[12px]">staleHolder</code> cuma
            sekitar 30% — dan ternyata flag-nya benar, kunci jawabannya yang
            kurang: barang yang masih dipegang orang yang sudah resign ditandai,
            tapi tidak ada di kunci. Dipisah jadi jenis cacat tersendiri.
            Property test-nya pun sempat lulus padahal dari 2.000 run acak tidak
            satu pun benar-benar menyelesaikan satu perpindahan; generatornya
            dibobot ulang, dan sekarang ada assertion yang gagal kalau
            cakupannya turun di bawah 10%.
          </p>
          <Shot
            src="app-reconciliation"
            alt="Layar Rekonsiliasi bulanan dengan periode terbuka: daftar barang per region untuk dicek, dan tempat perbedaan dicatat sebagai exception."
            caption="Rekonsiliasi bulanan, data contoh. Setiap barang dicek sekali per periode; perbedaannya tidak dihapus, melainkan dideklarasikan sebagai exception."
          />
        </ReadSection>

        <ReadSection number="06" title="Standar native, diukur di perangkat sungguhan">
          <p>
            Semua layar dan setiap langkah alur serah terima diaudit otomatis
            oleh{" "}
            <code className="font-mono text-[12px]">apps/web/e2e/native.spec.ts</code>,
            bukan dilihat sekilas. Jalan di Chromium profil ponsel secara lokal,
            dan di{" "}
            <strong className="font-medium text-fg">WebKit iPhone 12</strong> di
            CI.
          </p>
          <Rows
            head={["Kriteria", "Hasil"]}
            rows={[
              ["Target sentuh ≥ 44px", "Setiap kontrol terlihat, setelah setiap langkah"],
              ["Field ≥ 16px", "Setiap input, select, dan textarea"],
              ["Tanpa geser samping", "Di lebar ponsel dan lagi di 320px"],
              ["WCAG 2 AA", "axe, nol temuan serious atau critical"],
              ["Run pertama", "Nav 21px, tombol 38–39px, field 13–14px, file input tanpa label, tabel tak terjangkau keyboard"],
              ["Run kedua", "0 temuan, di 6 halaman dan 6 langkah"],
            ]}
          />
          <p>
            Satu hal yang <em>tidak</em> ada di halaman ini: angka
            tap&nbsp;→&nbsp;frame. Standarnya memang punya kriteria itu (K7,
            target p75 di bawah 100 ms), tapi dokumen auditnya menaruhnya di
            bawah judul <em>&ldquo;Not measured yet&rdquo;</em> — bersama K8
            (data sebesar produksi), K9 (review motion), dan K10 (data lapangan).
            Halaman yang seluruh argumennya adalah &ldquo;ini diukur&rdquo; tidak
            boleh memuat angka yang belum diukur.
          </p>
          <div className="flex flex-wrap gap-4 my-6">
            <Shot
              src="app-movements-phone"
              alt="Layar serah terima di lebar 390px: formulir ajuan menumpuk ke bawah dengan field dan tombol berukuran sentuh."
              caption="390px — lebar yang paling sering dipakai."
            />
            <Shot
              src="app-dashboard-phone"
              alt="Dashboard di lebar 390px: angka ringkasan, batang per region, dan tabel barang yang bisa digeser."
              caption="Dashboard di lebar yang sama."
            />
          </div>
        </ReadSection>

        <ReadSection number="07" title="Eksplorasi desain">
          <p>
            Tampilannya ditetapkan lebih dulu sebagai satu halaman eksplorasi:
            putih, tinta hitam, dan satu aksen amber{" "}
            <span className="dalrs-mono text-[12px]">#F5A623</span> yang dipakai
            seperti lakban di kardus — penanda, bukan latar. Hurufnya Archivo
            yang dilebarkan (font-stretch 115–120%, seperti huruf stensil di
            gudang) untuk judul, dan IBM Plex Mono untuk setiap label dan angka.
          </p>
          <p>
            Satu aturan yang mudah dilanggar: amber itu{" "}
            <strong className="font-medium text-fg">tidak pernah jadi alas teks</strong>.
            Terhadap putih rasionya sekitar 1,9:1, jauh di bawah ambang mana pun,
            jadi di halaman ini dan di filmnya ia hanya muncul sebagai garis,
            titik, dan sinar scanner.
          </p>
          <div className="my-6 flex flex-wrap items-center gap-4">
            {["box", "ticket", "stamp", "handover", "rack"].map((k) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={k}
                src={`/work/dalrs/iso-${k}.svg`}
                alt={`Ikon isometrik: ${k}`}
                width={56}
                height={56}
                className="h-14 w-auto"
              />
            ))}
          </div>
          <p>
            Lima ikon langkah di atas, gambar gudang di bagian 01, dan tumpukan
            lapisan di bagian 03 semuanya keluar dari satu modul yang sama —{" "}
            <code className="font-mono text-[12px]">apps/web/src/iso.ts</code>,
            satu proyeksi isometrik untuk seluruh produk. Berkas SVG di halaman
            ini dibangkitkan ulang dari modul itu, bukan digambar ulang.
          </p>
          <p>
            <a
              href="https://claude.ai/artifact/JxUGSuojj5LCVwVaLLm93Q"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              Lihat artifact desain
            </a>{" "}
            — halaman eksplorasinya. Butuh akses; kalau tidak terbuka, isinya
            dikutip di bagian ini.
          </p>
        </ReadSection>

        <ReadSection number="08" title="Lihat sendiri">
          <p>
            <a href="https://dalrs.vercel.app" target="_blank" rel="noopener noreferrer" className={linkish}>
              Aplikasinya
            </a>{" "}
            ·{" "}
            <a href="https://dalrs.vercel.app/demo" target="_blank" rel="noopener noreferrer" className={linkish}>
              Demo alurnya
            </a>{" "}
            ·{" "}
            <a href="https://github.com/SurfingWhale/DALRs" target="_blank" rel="noopener noreferrer" className={linkish}>
              Kode sumber
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/SurfingWhale/DALRs/blob/main/docs/evaluation.md"
              target="_blank"
              rel="noopener noreferrer"
              className={linkish}
            >
              Dokumen evaluasinya
            </a>
          </p>
          <Shot
            src="app-dashboard"
            alt="Dashboard DALRS: 36 barang, 31 dipegang, 2 di gudang, 7 perlu perhatian; batang per region untuk Jakarta, Bandung, dan Surabaya; lalu tabel seluruh barang dengan pemegang, kondisi, dan statusnya."
            caption="Dashboard, data contoh. Setiap angka di atas tabel adalah hitungan dari baris yang sama — bukan nilai yang disimpan terpisah."
          />
          <p className="text-[11px] leading-[1.7] text-fg-muted">
            Semua tangkapan layar di halaman ini diambil dari aplikasinya yang
            dijalankan lokal dengan data contoh bawaannya. Tanpa kredensial
            Firebase, DALRS memang berjalan dalam mode demo di browser — jadi
            tidak ada data sungguhan yang muncul di sini.
          </p>
        </ReadSection>

        <ReadSection number="09" title="Terkait">
          <p>
            Hal lain di situs ini yang dibangun dari pertanyaan, bukan dari
            dataset, adalah{" "}
            <Link href="/work/salespal" className={linkish}>
              SalesPal
            </Link>{" "}
            — sama-sama soal mencatat yang sudah terjadi, satu di gudang dan satu
            di ruang chat.
          </p>
        </ReadSection>

        <ShareRow url={`${SITE}/work/dalrs`} title={TITLE} />
      </article>
    </ReadPage>
  );
}
