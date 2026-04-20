import Image from "next/image";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import styles from "./foundation.module.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-c3-display",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-c3-mono",
  display: "swap",
});

export const metadata = {
  title: "Design Foundation · C3 · Светлый · CITYRNNG",
};

type FigureProps = {
  className: string;
  alt?: string;
  priority?: boolean;
};

function Character({ className, alt = "", priority = false }: FigureProps) {
  return (
    <div className={className}>
      <Image
        src="/brand/character.png"
        alt={alt}
        fill
        sizes="(max-width: 1440px) 100vw, 600px"
        style={{ objectFit: "contain" }}
        priority={priority}
      />
    </div>
  );
}

export default function FoundationC3Page() {
  return (
    <div className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} ${styles.root}`}>
      {/* TERMINAL BAR */}
      <div className={styles.term}>
        <div>
          <span className={styles.dot} />
          CITYRNNG / <b>C3 · LIGHT</b> / STYLE&nbsp;TILE
        </div>
        <div>
          RUN#001 · START FROM 3KM · BEGINNERS / <b>ONBOARDING</b>
        </div>
        <div>2026 · v0.3 · Sport&nbsp;Light</div>
      </div>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroTxt}>
          <div className={styles.eyebrow}>
            <span>[01 / HERO]</span>
            <b>BEGIN.RUN()</b>
            <span>FOR BEGINNERS · 3&nbsp;KM · YOUR PACE</span>
          </div>
          <h1 className={styles.h1}>
            Сегодня — <em>твой</em>&nbsp;первый километр.
            <br />
            Завтра&nbsp;— <span className={styles.strike}>страх</span>
          </h1>
          <p className={styles.lede}>
            Ситираннинг для&nbsp;тех, кто&nbsp;никогда не&nbsp;бегал.{" "}
            <b>3&nbsp;км в&nbsp;своём темпе</b>, пауза — это нормально, закончить пешком — тоже.
            Выйди один&nbsp;раз — получи&nbsp;+30&nbsp;баллов.
          </p>
          <div className={styles.cta}>
            <button className={styles.btnPr}>
              Начать первый забег <span className={styles.ar}>▸</span>
            </button>
            <button className={styles.btnSc}>Как это работает</button>
          </div>
          <div className={styles.kpi}>
            <div className={styles.kpiCell}>
              <div className={styles.kpiKey}>START FROM</div>
              <div className={`${styles.kpiVal} ${styles.accent}`}>
                3<sup>км</sup>
              </div>
            </div>
            <div className={styles.kpiCell}>
              <div className={styles.kpiKey}>YOUR PACE</div>
              <div className={styles.kpiVal}>свой</div>
            </div>
            <div className={styles.kpiCell}>
              <div className={styles.kpiKey}>FIRST BONUS</div>
              <div className={`${styles.kpiVal} ${styles.accent}`}>
                +30<sup>Б</sup>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroImg}>
          <div className={styles.phBg} />
          <div className={`${styles.crop} ${styles.tl}`} />
          <div className={`${styles.crop} ${styles.tr}`} />
          <div className={`${styles.crop} ${styles.bl}`} />
          <div className={`${styles.crop} ${styles.br}`} />
          <div className={styles.kb}>
            <span>FRAME · 001</span>
            <span>GORKY&nbsp;PARK · SAT&nbsp;09:00</span>
            <span>
              <b>REC</b>
            </span>
          </div>
          <Character className={styles.figure} alt="Бегун CITYRNNG" priority />
          <div className={styles.sticker}>
            ПЕРВЫЙ РАЗ — OK
            <small>начни с&nbsp;3&nbsp;км</small>
          </div>
          <div className={styles.tagBl}>CITY RUNNING CLUB / SINCE 2026</div>
        </div>
      </section>

      {/* PALETTE */}
      <section className={styles.sec}>
        <div className={styles.sh}>
          <div className={styles.sn}>02 / PALETTE</div>
          <div className={styles.st}>Белый свет + бренд-красный</div>
          <div className={styles.sm}>OKLCH · WCAG AA · SPORT</div>
        </div>
        <div className={styles.pal}>
          <div className={styles.sw} style={{ background: "var(--red)", color: "#fff" }}>
            <div>brand-red</div>
            <div className={styles.swHex}>#E63025</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--red-ink)", color: "#fff" }}>
            <div>red-ink · hover</div>
            <div className={styles.swHex}>#B8251C</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--ink)", color: "var(--paper-2)" }}>
            <div>ink</div>
            <div className={styles.swHex}>#0F0E0C</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--graphite)", color: "#fff" }}>
            <div>graphite</div>
            <div className={styles.swHex}>#3A3833</div>
          </div>
          <div className={styles.sw}>
            <div>paper — base</div>
            <div className={styles.swHex}>#FFFFFF</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--paper-2)" }}>
            <div>paper-2 · surface</div>
            <div className={styles.swHex}>#F4F4F2</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--paper-3)" }}>
            <div>paper-3 · divider</div>
            <div className={styles.swHex}>#E9E9E6</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--tint)" }}>
            <div>red-tint</div>
            <div className={styles.swHex}>#FFE2DF</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--muted)", color: "#fff" }}>
            <div>muted</div>
            <div className={styles.swHex}>#6B6862</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--muted-2)" }}>
            <div>muted-2</div>
            <div className={styles.swHex}>#B4B0A8</div>
          </div>
          <div
            className={styles.sw}
            style={{ background: "var(--paper)", color: "var(--red)", border: "1px solid var(--red)" }}
          >
            <div>red · ghost</div>
            <div className={styles.swHex}>on white</div>
          </div>
          <div className={styles.sw} style={{ background: "var(--ink)", color: "var(--red)" }}>
            <div>red · on ink</div>
            <div className={styles.swHex}>night mode</div>
          </div>
        </div>
      </section>

      {/* TYPE */}
      <section className={styles.sec}>
        <div className={styles.sh}>
          <div className={styles.sn}>03 / TYPE</div>
          <div className={styles.st}>Space Grotesk · JetBrains Mono</div>
          <div className={styles.sm}>NO TRICKS · STAY&nbsp;SHARP</div>
        </div>
        <div className={styles.type}>
          <div>
            <div className={styles.caps}>HERO · 96 / 88 / -4.5%</div>
            <div className={styles.hHero}>
              Первый <em>километр</em>.
            </div>
            <div className={styles.caps}>H1 · 56 / 92 / -3.5%</div>
            <div className={styles.h1Sample}>Не умеешь? Научим. Вышел — плюс тридцать.</div>
            <div className={styles.caps}>H2 · 32 / 100 / -2%</div>
            <div className={styles.h2Sample}>Суббота, 09:00. Парк Горького.</div>
            <div className={styles.caps}>H3 · 22 / 115 / -1%</div>
            <div className={styles.h3Sample}>Приводи друга — ещё +20&nbsp;баллов каждому.</div>
            <div className={styles.caps}>BODY · 16 / 155</div>
            <div className={styles.bodySample}>
              Необязательно быть «спортсменом». Мы&nbsp;покажем, где начать, как&nbsp;дышать, сколько пить.
              Баллы начисляются просто за&nbsp;то, что&nbsp;ты&nbsp;вышел.
            </div>
          </div>
          <div className={styles.typeSide}>
            <div className={styles.specs}>
              <b>--font-display</b>: Space Grotesk
              <br />
              <b>--font-mono</b>: JetBrains Mono
              <br />
              <br />
              <b>weights</b>: 400 · 500 · 600 · 700
              <br />
              <b>letter-spacing</b>: -4.5% → 0% → +18%
              <br />
              <b>line-height</b>: 0.88 → 1.55
              <br />
              <b>ratio</b>: 1.333 (fourth)
              <br />
              <br />
              <b>mono usage</b>: labels · data · HUD · crop marks
            </div>
            <div>
              <div className={styles.caps}>SCALE</div>
              <div className={styles.scale}>
                <span className={styles.scaleN}>96</span>
                <span
                  className={styles.scaleT}
                  style={{ fontSize: "30px", letterSpacing: "-0.03em" }}
                >
                  ПЕРВЫЙ
                </span>
              </div>
              <div className={styles.scale}>
                <span className={styles.scaleN}>56</span>
                <span
                  className={styles.scaleT}
                  style={{ fontSize: "24px", letterSpacing: "-0.025em" }}
                >
                  ДАВАЙ
                </span>
              </div>
              <div className={styles.scale}>
                <span className={styles.scaleN}>32</span>
                <span
                  className={styles.scaleT}
                  style={{ fontSize: "18px", letterSpacing: "-0.015em" }}
                >
                  СУББОТА
                </span>
              </div>
              <div className={styles.scale}>
                <span className={styles.scaleN}>22</span>
                <span className={styles.scaleT} style={{ fontSize: "15px" }}>
                  Приводи друга
                </span>
              </div>
              <div className={styles.scale}>
                <span className={styles.scaleN}>16</span>
                <span className={styles.scaleT} style={{ fontSize: "14px", fontWeight: 400 }}>
                  Базовый текст читается спокойно.
                </span>
              </div>
              <div className={styles.scale}>
                <span className={styles.scaleN}>11</span>
                <span
                  className={styles.scaleT}
                  style={{
                    fontFamily: "var(--fm)",
                    fontSize: "10px",
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  MONO · HUD · LABEL
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRIMITIVES */}
      <section className={styles.sec}>
        <div className={styles.sh}>
          <div className={styles.sn}>04 / PRIMITIVES</div>
          <div className={styles.st}>Кнопки · теги · поля · карточки</div>
          <div className={styles.sm}>RADIUS 0 · 1PX BORDER · NO SHADOWS</div>
        </div>

        <div className={styles.caps}>BUTTONS</div>
        <div className={styles.prim} style={{ marginTop: 8 }}>
          <button className={`${styles.btn} ${styles.pr}`}>
            Начать первый забег <span className={styles.btnAr}>▸</span>
          </button>
          <button className={`${styles.btn} ${styles.dk}`}>Записаться на&nbsp;субботу</button>
          <button className={styles.btn}>Посмотреть маршруты</button>
          <button className={`${styles.btn} ${styles.gh}`}>Уже бегаю ▸</button>
          <button className={`${styles.btn} ${styles.sm}`}>+30 Б</button>
          <button className={`${styles.btn} ${styles.sm} ${styles.pr}`}>НАЧАТЬ</button>
          <button className={`${styles.btn} ${styles.sm} ${styles.dk}`}>09:00 СБ</button>
        </div>

        <div className={styles.caps} style={{ marginTop: 24 }}>
          TAGS · STATES
        </div>
        <div className={styles.tags} style={{ marginTop: 8 }}>
          <span className={`${styles.tg} ${styles.a}`}>НОВИЧКАМ OK</span>
          <span className={`${styles.tg} ${styles.s}`}>3 КМ</span>
          <span className={styles.tg}>СВОЙ ТЕМП</span>
          <span className={`${styles.tg} ${styles.sf}`}>ПАУЗЫ OK</span>
          <span className={`${styles.tg} ${styles.a}`}>+30 Б</span>
          <span className={styles.tg}>ГРУППА 12</span>
          <span className={styles.tg}>ПО&nbsp;СУББОТАМ</span>
          <span className={`${styles.tg} ${styles.s}`}>С&nbsp;НУЛЯ</span>
        </div>

        <div className={styles.caps} style={{ marginTop: 24 }}>
          INPUTS
        </div>
        <div className={styles.inpRow}>
          <div className={styles.fld}>
            <span className={styles.lbl}>01 · КАК&nbsp;К&nbsp;ТЕБЕ ОБРАЩАТЬСЯ?</span>
            <input className={styles.inp} defaultValue="Лёша · первый раз" />
          </div>
          <div className={styles.fld}>
            <span className={styles.lbl}>02 · ТЕЛЕФОН</span>
            <input
              className={`${styles.inp} ${styles.focus}`}
              placeholder="+7 (___) ___ __ __"
            />
          </div>
          <div className={styles.fld}>
            <span className={styles.lbl}>03 · ГОРОД</span>
            <input className={styles.inp} defaultValue="Москва" />
          </div>
        </div>

        <div className={styles.caps} style={{ marginTop: 28 }}>
          CARDS
        </div>
        <div className={styles.prims} style={{ marginTop: 8 }}>
          {/* TRAINING CARD */}
          <div className={styles.trCard}>
            <div className={styles.trPh}>
              <Character className={styles.trFig} alt="" />
              <div className={styles.trNum}>
                #001<span>.</span>
              </div>
              <div className={styles.trTag}>3 KM · BEGINNERS</div>
            </div>
            <div className={styles.trBody}>
              <div className={styles.trHd}>
                <span>
                  CITYRNNG / <b>#001</b>
                </span>
                <span>СБ 18.04</span>
              </div>
              <h3 className={styles.trH3}>Первый круг. Парк Горького.</h3>
              <p className={styles.trP}>
                Спокойный старт в&nbsp;группе из&nbsp;12&nbsp;человек. Гид бежит рядом и&nbsp;следит
                за&nbsp;темпом — можно идти пешком.
              </p>
              <div className={styles.mtr}>
                <div>
                  <div className={styles.mtrK}>DIST</div>
                  <div className={styles.mtrV}>3.0&nbsp;км</div>
                </div>
                <div>
                  <div className={styles.mtrK}>ТЕМП</div>
                  <div className={`${styles.mtrV} ${styles.accent}`}>свой</div>
                </div>
                <div>
                  <div className={styles.mtrK}>PTS</div>
                  <div className={`${styles.mtrV} ${styles.accent}`}>+30</div>
                </div>
              </div>
            </div>
          </div>

          {/* ONBOARDING */}
          <div className={styles.onb}>
            <div className={styles.onbSl}>
              <span>STEP 02 / 04</span>
              <span>
                <b>цель на&nbsp;месяц</b>
              </span>
            </div>
            <div className={styles.onbBar}>
              <div className={`${styles.s} ${styles.on}`} />
              <div className={`${styles.s} ${styles.on}`} />
              <div className={styles.s} />
              <div className={styles.s} />
            </div>
            <h4 className={styles.onbH4}>Сколько раз в&nbsp;неделю планируешь выходить?</h4>
            <p className={styles.onbP}>
              Не обещай слишком много. Два&nbsp;раза — отличный старт.
            </p>
            <div className={styles.onbOpts}>
              <button className={styles.btn}>1 раз</button>
              <button className={`${styles.btn} ${styles.pr}`}>2 раза</button>
              <button className={styles.btn}>3+ раза</button>
            </div>
            <div className={styles.caps} style={{ marginTop: 4 }}>
              НАСТРОЙКА · 00:52
            </div>
          </div>

          {/* REWARD */}
          <div className={styles.rw}>
            <div className={styles.rwPn}>КОФЕЙНЯ «ДВОР» · ЧИСТЫЕ ПРУДЫ</div>
            <h4 className={styles.rwH4}>Фильтр + круассан</h4>
            <p className={styles.rwP}>
              Потрать баллы за&nbsp;первый забег — любой напиток&nbsp;+ выпечка на&nbsp;выбор.
            </p>
            <div className={styles.rwPr}>
              <span className={styles.rwPn}>потратить</span>
              <span className={styles.rwPts}>90</span>
            </div>
            <button className={`${styles.btn} ${styles.pr}`} style={{ justifyContent: "center" }}>
              Взять промо-код ▸
            </button>
          </div>
        </div>
      </section>

      {/* PATTERN / ICON GRID */}
      <section className={styles.sec}>
        <div className={styles.sh}>
          <div className={styles.sn}>05 / PATTERN</div>
          <div className={styles.st}>Силуэт &amp; сетка</div>
          <div className={styles.sm}>RUNNER GLYPH · 3×6</div>
        </div>
        <div className={styles.pat}>
          <div className={`${styles.pc} ${styles.r}`}>
            <span className={styles.pcLbl}>01</span>
            <Character className={styles.pcFig} alt="" />
          </div>
          <div className={styles.pc}>
            <span className={styles.pcLbl}>02</span>
            <Character className={styles.pcFig} alt="" />
          </div>
          <div className={`${styles.pc} ${styles.d}`}>
            <span className={styles.pcLbl}>03</span>
            <Character className={styles.pcFig} alt="" />
          </div>
          <div className={`${styles.pc} ${styles.t}`}>
            <span className={styles.pcLbl}>04</span>
            <Character className={styles.pcFig} alt="" />
          </div>
          <div className={`${styles.pc} ${styles.g}`}>
            <span className={styles.pcLbl}>05</span>
            <Character className={styles.pcFig} alt="" />
          </div>
          <div className={`${styles.pc} ${styles.h}`}>
            <span className={styles.pcLbl} style={{ color: "var(--ink)" }}>
              06
            </span>
          </div>
        </div>
      </section>

      {/* COMPOSITION */}
      <section className={styles.sec}>
        <div className={styles.sh}>
          <div className={styles.sn}>06 / COMPOSITION</div>
          <div className={styles.st}>Обложка тренировки</div>
          <div className={styles.sm}>LAYOUT REFERENCE</div>
        </div>
        <div className={styles.comp}>
          <div className={styles.ptext}>
            <div className={styles.eb}>FIRST RUN · ОТКРЫТА&nbsp;ЗАПИСЬ</div>
            <h3 className={styles.compH3}>
              Парк Горького,
              <br />
              <em>3&nbsp;км</em>, в&nbsp;своём темпе.
            </h3>
            <div className={styles.compBody}>
              Спокойный старт на&nbsp;набережной. Гид, группа из&nbsp;12&nbsp;человек, кофе после. Можно
              идти пешком — баллы всё&nbsp;равно зачтём.
            </div>
            <div className={styles.mg}>
              <div className={styles.mgCell}>
                <div className={styles.mgK}>DATE</div>
                <div className={styles.mgV}>18.04</div>
              </div>
              <div className={styles.mgCell}>
                <div className={styles.mgK}>START</div>
                <div className={styles.mgV}>09:00</div>
              </div>
              <div className={styles.mgCell}>
                <div className={styles.mgK}>DIST</div>
                <div className={styles.mgV}>3&nbsp;км</div>
              </div>
              <div className={styles.mgCell}>
                <div className={styles.mgK}>BONUS</div>
                <div className={`${styles.mgV} ${styles.accent}`}>+30 Б</div>
              </div>
            </div>
            <div className={styles.prim}>
              <button className={`${styles.btn} ${styles.pr}`}>
                Это мой первый раз <span className={styles.btnAr}>▸</span>
              </button>
              <button className={`${styles.btn} ${styles.gh}`}>12 / 20 записались</button>
            </div>
          </div>
          <div className={styles.pimg}>
            <div className={styles.pimgLb}>
              <span>FRAME · 002</span>
              <b>REC ●</b>
            </div>
            <Character className={styles.pimgFig} alt="" />
            <div className={styles.pimgSticker}>
              БЕЗ ГОНКИ.
              <br />
              БЕЗ СЕКУНДОМЕРА.
            </div>
          </div>
        </div>
      </section>

      {/* MANIFESTO */}
      <section className={styles.sec}>
        <div className={styles.sh}>
          <div className={styles.sn}>07 / MANIFESTO</div>
          <div className={styles.st}>Для кого&nbsp;C3</div>
        </div>
        <div className={styles.mf}>
          Для тех, кто хочет <b>начать</b>, но&nbsp;боится, что «недостаточно спортсмен».
          <br />
          Ты уже им стал — в&nbsp;момент, когда <b>вышел</b>.
        </div>
      </section>

      {/* TOKENS */}
      <section className={styles.secTokens}>
        <div className={styles.vars}>
          <div className={styles.varsGr}>
            <h5>COLORS</h5>
            <b>--ink</b>: #0F0E0C
            <br />
            <b>--graphite</b>: #3A3833
            <br />
            <b>--paper</b>: #FFFFFF
            <br />
            <b>--paper-2</b>: #F4F4F2
            <br />
            <b>--brand-red</b>: #E63025
            <br />
            <b>--red-ink</b>: #B8251C
            <br />
            <b>--red-tint</b>: #FFE2DF
          </div>
          <div className={styles.varsGr}>
            <h5>TYPE</h5>
            <b>--font-display</b>: Space Grotesk
            <br />
            <b>--font-mono</b>: JetBrains Mono
            <br />
            <b>--hero</b>: 96 / 700 / -4.5%
            <br />
            <b>--h1</b>: 56 / 700 / -3.5%
            <br />
            <b>--h2</b>: 32 / 600 / -2%
            <br />
            <b>--body</b>: 16 / 400 / 1.55
            <br />
            <b>--mono</b>: 11 / 500 / +16%
          </div>
          <div className={styles.varsGr}>
            <h5>SHAPE</h5>
            <b>--radius</b>: 0
            <br />
            <b>--border</b>: 1px solid var(--ink)
            <br />
            <b>--grid</b>: 24px
            <br />
            <b>--shadow</b>: none
            <br />
            <b>--btn-pad</b>: 14&nbsp;18
            <br />
            <b>--section-pad</b>: 48
            <br />
            <b>--crop-marks</b>: 16px · 1.5px
          </div>
        </div>
      </section>
    </div>
  );
}
