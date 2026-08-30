// app/work/padel/ExecutiveSummary.tsx
//
// Fauzy's ExecutiveSummary_PondokLabu.md, rendered as the document it is.
//
// One thing is changed from the source: the byline carried his GitHub handle
// and now carries his name. That handle belongs to his creative account and he
// asked for it off the site; his name is already in the footer, the author
// meta and the page title, so the byline still means something.
//
// Kept in the Indonesian he wrote it in. Translating it would turn the
// artefact back into my prose, which is the opposite of the point — and the
// site already quotes his Indonesian verbatim inside English framing
// elsewhere. Two figures in the original (the isochrone map and the strategic
// dashboard) live in a gitignored output/ directory and are not in the repo,
// so they are named where they sat rather than faked.

function Table({
  head,
  rows,
  align,
}: {
  head: string[];
  rows: React.ReactNode[][];
  align?: ("l" | "r")[];
}) {
  return (
    <div className="doc-table">
      <table>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} style={{ textAlign: align?.[i] === "r" ? "right" : "left" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, k) => (
                <td key={k} style={{ textAlign: align?.[k] === "r" ? "right" : "left" }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Where a figure sat in the original. Named, not faked. */
function MissingFigure({ label }: { label: string }) {
  return (
    <figure className="my-5">
      <div className="border border-dashed border-border-strong rounded-md py-7 px-5 text-center">
        <span className="text-[11px] uppercase tracking-[0.14em] text-fg-label">
          Figure — {label}
        </span>
      </div>
      <figcaption>
        In the original this is a rendered image from <code>output/</code>,
        which is gitignored and not in the repository.
      </figcaption>
    </figure>
  );
}

export function ExecutiveSummary() {
  return (
    <>
      <h1>Strategic Snapshot: Sense Padel Pondok Labu</h1>
      <p>
        <strong>Community Moat &amp; Survival Intelligence Analysis</strong>
        <br />
        Analytic by: Muhammad Fauzy
      </p>

      <blockquote>
        <p>
          <strong>Konteks:</strong> Analisis awal berbasis publik data Google
          Maps (Mei 2026) (142 courts, 41 reviews dari 9 courts). Sebagai
          instrumen navigasi awal, tulisan ini lebih condong ke dalam bentuk{" "}
          <em>peta awal</em> diskusi ekologis, bukan kesimpulan final.
        </p>
      </blockquote>

      <hr />

      <h2>Ekologi Kompetisi: Hukum Kepadatan</h2>
      <p>
        Dalam <em>Organizational Ecology</em> (1989), buku yang menjadi fondasi
        bidang ini, Hannan dan Freeman menjelaskan bahwa pertumbuhan suatu
        populasi organisasi selalu dikendalikan oleh dua kekuatan yang bekerja
        secara berlawanan:
      </p>
      <ul>
        <li>
          <strong>Legitimasi</strong> bekerja di fase awal. Ketika belum banyak
          organisasi sejenis, setiap penambahan pemain baru justru menguntungkan
          semua. Bayangkan tahun 2018 ketika padel pertama kali masuk Jakarta —
          setiap <em>court</em> baru membantu membuktikan bahwa padel adalah
          olahraga nyata. Konsumen percaya, investor melirik, dan semua pemain
          diuntungkan bersama.
        </li>
        <li>
          <strong>Kompetisi</strong> bekerja di fase berikutnya. Ketika jumlah
          pemain melewati titik tertentu, penambahan satu <em>court</em> baru
          tidak lagi meningkatkan legitimasi — ia hanya mengambil irisan dari kue
          yang ukurannya tidak bertambah secepat itu. Pemain yang sama
          diperebutkan oleh lebih banyak venue. Margin mulai tertekan. Dan yang
          paling lemah mulai mati.
        </li>
      </ul>

      <MissingFigure label="Isochrone map, 10 menit berkendara" />

      <hr />

      <h2>Yang Datanya Ngomong</h2>

      <h3>Kepadatan Kompetitor</h3>
      <Table
        head={["Radius", "Jumlah Lapangan", "Status"]}
        align={["l", "r", "l"]}
        rows={[
          ["≤ 3 km (≈ 10 mnt)", <strong key="a">41 lapangan</strong>, "Sangat Padat"],
          ["≤ 5 km (≈ 15 mnt)", <strong key="b">86 lapangan</strong>, "Sangat Padat"],
          ["≤ 10 km (≈ 20 mnt)", <strong key="c">140 lapangan</strong>, "Titik Jenuh"],
        ]}
      />
      <p>
        Margin hampir pasti akan tertekan saat <em>growth</em> padel mulai
        melandai — ini bukan spekulasi, ini pola yang terjadi di hampir semua
        olahraga <em>hype cycle</em> sebelumnya.
      </p>

      <h3>Apa yang Customer Tulis di Review</h3>
      <Table
        head={["Dimensi", "Sense Padel", "Rata-rata Kompetitor"]}
        align={["l", "r", "r"]}
        rows={[
          ["Experience (fasilitas, lapangan)", <strong key="a">80%</strong>, "77%"],
          ["Service (staf, booking, harga)", <strong key="b">10%</strong>, "6%"],
          ["Social (komunitas, liga, event)", <strong key="c">10%</strong>, "10%"],
        ]}
      />
      <p>
        Hampir semua orang menulis soal fasilitas. Data Google Review
        menunjukkan minimnya penyebutan soal komunitas atau teman. Hal ini bisa
        berarti dua hal: komunitasnya memang belum ada, atau interaksi sosial
        tersebut berpindah ke <em>third-party app</em> (seperti Reclub) atau
        media sosial lain yang tidak tercatat di Google Maps.
      </p>

      <h3>Community Moat Score</h3>
      <MissingFigure label="Strategic dashboard" />
      <p>
        <strong>Apa itu Community Moat?</strong> Dalam bisnis, <em>Moat</em>{" "}
        (parit) adalah keunggulan kompetitif. Jika Fasilitas adalah parit yang
        dangkal, maka <strong>Community Moat</strong> adalah parit yang paling
        dalam. Ini adalah kondisi di mana nilai sebuah tempat bukan lagi soal
        kualitas lapangan, tapi karena &ldquo;teman-teman saya enjoy main di
        sini&rdquo;. Ketika komunitas terbentuk, <em>switching cost</em>{" "}
        emosional menjadi sangat tinggi.
      </p>
      <Table
        head={["Court", "Moat Score"]}
        align={["l", "r"]}
        rows={[
          ["Quattro Padel", <strong key="a">59.1 / 100</strong>],
          ["Hi Padel Andara", <strong key="b">39.8 / 100</strong>],
          ["three one three padel court", <strong key="c">36.7 / 100</strong>],
          [<strong key="d">Sense Padel Margasatwa</strong>, <strong key="e">35.7 / 100</strong>],
          ["Sense Padel Kemang", <strong key="f">19.4 / 100</strong>],
        ]}
      />
      <p>
        <strong>Insight:</strong> Sense Padel unggul tipis dari rata-rata
        (25.7). Namun, belum ada satu pun pemain yang punya <em>moat</em> kuat
        di atas 60. Ini adalah jendela peluang yang masih terbuka.
      </p>

      <h3>Gap Niche</h3>
      <Table
        head={["Niche", "Demand", "Coverage", "Gap"]}
        align={["l", "r", "r", "r"]}
        rows={[
          [<strong key="a">Beginner Academy</strong>, <strong key="b">2.4%</strong>, <strong key="c">0.0%</strong>, <strong key="d">2.4</strong>],
          ["Liga & Kompetisi", "4.9%", "6.5%", "—"],
          ["Ladies Community", "0.0%", "0.0%", "0.0"],
          ["Business Networking", "0.0%", "0.0%", "0.0"],
        ]}
      />

      <hr />

      <h2>
        Yang Datanya Nggak Bisa Ngomong (<em>Blind Spots</em>)
      </h2>
      <p>
        Data Google Review memiliki batasan sistemik yang harus didiskusikan
        sebelum keputusan besar diambil:
      </p>
      <ul>
        <li>
          <strong>Silent Majority:</strong> Mayoritas customer tidak menulis
          review. Data ini seringkali hanya mewakili mereka yang sangat puas
          atau sangat kecewa.
        </li>
        <li>
          <strong>Retention Rate:</strong> Review tidak bisa mengukur siapa yang
          datang kembali. Bisnis yang bertahan adalah bisnis yang menjaga
          pelanggan lama, bukan sekadar mencari yang baru.
        </li>
        <li>
          <strong>Invisible Tribes:</strong> Komunitas loyal yang aktif di
          WhatsApp atau turnamen informal seringkali tidak muncul dalam data
          publik.
        </li>
        <li>
          <strong>Pricing Pressure:</strong> Data publik tidak memperlihatkan
          elastisitas harga atau promosi agresif yang sedang berjalan di
          lapangan.
        </li>
      </ul>

      <hr />

      <h2>Pertanyaan yang Lebih Berguna dari Kesimpulan</h2>
      <ol>
        <li>
          <strong>
            Siapa <em>regular players</em> kita sekarang?
          </strong>{" "}
          Apa yang mereka lakukan di lapangan selain bermain padel?
        </li>
        <li>
          <strong>Apa yang dilakukan Quattro Padel secara berbeda?</strong>{" "}
          Mengapa <em>moat</em> mereka mencapai 59.1?
        </li>
        <li>
          <strong>Kenapa orang berhenti datang?</strong> Ini data yang jauh
          lebih berharga daripada rating bintang lima.
        </li>
        <li>
          <strong>Beginner Academy:</strong> Apakah hambatan operasional yang
          membuat ceruk ini belum tergarap maksimal?
        </li>
      </ol>

      <hr />

      <h2>Kalau Dipaksa Milih Satu Arah</h2>
      <p>
        <strong>
          Jadikan <em>regular players</em> yang ada sebagai basis — bukan
          akuisisi customer baru.
        </strong>{" "}
        Inilah titik mulai pembangunan <em>community moat</em> yang sebenarnya:
        bicara dengan mereka yang sudah datang, amankan loyalitasnya, dan
        biarkan komunitas tumbuh secara organik dari sana.
      </p>

      <hr />

      <h3>Referensi &amp; Catatan Kaki</h3>
      <p>
        Analisis ini berpijak pada kerangka kerja sosiologi industri dan
        manajemen strategis berikut:
      </p>
      <ol>
        <li>
          <strong>
            Hannan, M. T., &amp; Freeman, J. (1989). <em>Organizational Ecology</em>.
            Harvard University Press.
          </strong>{" "}
          (Teori <em>Density Dependence</em> untuk menjelaskan fase Legitimasi
          vs Kompetisi).
        </li>
        <li>
          <strong>
            Porter, M. E. (1985). <em>Competitive Advantage</em>. Free Press.
          </strong>{" "}
          (Konsep <em>Moat</em> dan struktur industri kompetitif).
        </li>
        <li>
          <strong>
            Putnam, R. D. (2000). <em>Bowling Alone</em>. Simon &amp; Schuster.
          </strong>{" "}
          (Konsep <em>Social Capital</em> dan pentingnya <em>belonging</em>{" "}
          dalam komunitas olahraga).
        </li>
        <li>
          <strong>
            Aldrich, H., &amp; Ruef, M. (2006). <em>Organizations Evolving</em>.
            SAGE Publications.
          </strong>{" "}
          (Adaptasi organisasi melalui ceruk pasar/<em>niche</em>).
        </li>
      </ol>
      <p>
        <em>
          Data: Google Maps scraping (Mei 2026). Metode: NLP classification,
          Haversine distance, Community Moat scoring. Limitasi: Sample size
          kecil, survivorship bias pada review.
        </em>
      </p>
    </>
  );
}
