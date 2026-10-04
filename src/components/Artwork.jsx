import React from "react";

export function Spark({ x = 0, y = 0, size = 8 }) {
  return (
    <path
      d={`M${x} ${y - size} Q${x + 2} ${y - 2} ${x + size} ${y} Q${x + 2} ${y + 2} ${x} ${y + size} Q${x - 2} ${y + 2} ${x - size} ${y} Q${x - 2} ${y - 2} ${x} ${y - size}Z`}
    />
  );
}

export function CardBack() {
  return (
    <svg viewBox="0 0 160 254" className="back-art" aria-hidden="true">
      <rect
        x="10"
        y="10"
        width="140"
        height="234"
        rx="10"
        className="back-border"
      />
      <rect
        x="16"
        y="16"
        width="128"
        height="222"
        rx="7"
        className="back-border thin"
      />
      <path
        d="M80 33 Q128 81 128 127 Q128 173 80 221 Q32 173 32 127 Q32 81 80 33Z"
        className="back-orbit"
      />
      <ellipse cx="80" cy="127" rx="49" ry="74" className="back-orbit" />
      <path
        d="M51 145V103l19 16h20l19-16v42c0 27-58 27-58 0Z"
        className="back-cat"
      />
      <path
        d="M64 139q6-7 12 0m9 0q6-7 12 0m-18 7 3 3 3-3"
        className="back-face"
      />
      <g className="back-stars">
        <Spark x={80} y={66} size={9} />
        <Spark x={80} y={189} size={9} />
        <Spark x={30} y={40} size={4} />
        <Spark x={130} y={214} size={4} />
      </g>
      <g className="back-dots">
        {[0, 1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <circle cx="26" cy={91 + i * 18} r="1.2" />
            <circle cx="134" cy={91 + i * 18} r="1.2" />
          </React.Fragment>
        ))}
      </g>
    </svg>
  );
}

function Motif({ type }) {
  if (type === "moon")
    return (
      <g>
        <path d="M61 47a22 22 0 1 1-17-34c-4 14 2 30 17 34Z" fill="#d9af65" />
        <Spark x={119} y={39} size={7} />
      </g>
    );
  if (type === "sun")
    return (
      <g stroke="#b88947" strokeWidth="2" fill="#e9bd6f">
        <circle cx="80" cy="34" r="14" />
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} transform={`rotate(${i * 45} 80 34)`} d="M80 12v-6" />
        ))}
      </g>
    );
  if (type === "heart")
    return <path d="M80 53C42 30 61 8 80 27c19-19 38 3 0 26Z" fill="#c77c7b" />;
  if (type === "plant")
    return (
      <g stroke="#657c60" strokeWidth="2.5" fill="#a4b296">
        <path d="M80 56V29" fill="none" />
        <path d="M80 42C61 41 60 24 60 24c18 0 21 12 20 18Zm0-7c16 0 21-20 21-20-21 2-22 14-21 20Z" />
      </g>
    );
  if (type === "cup")
    return (
      <g stroke="#9e7154" strokeWidth="2" fill="#d9af65">
        <path d="M65 27h27v17q-13 19-27 0Z" />
        <path d="M92 30q18-2 12 12-4 5-13 1" fill="none" />
        <path d="M75 22q-6-7 2-14m9 14q-5-6 1-11" fill="none" />
      </g>
    );
  if (type === "ball")
    return (
      <g stroke="#b77973" strokeWidth="1.7" fill="#dca29b">
        <circle cx="80" cy="35" r="18" />
        <path
          d="M62 35q18-18 36 0M62 39q18-18 36 0M74 18q-13 17 0 34m8-34q-13 17 0 34"
          fill="none"
        />
      </g>
    );
  return (
    <g fill="#d9af65">
      <Spark x={80} y={35} size={19} />
      <Spark x={43} y={27} size={5} />
      <Spark x={121} y={48} size={6} />
    </g>
  );
}

export function CatIllustration({ card }) {
  const motif = card.motif ?? ["moon", "star", "sun", "heart", "plant", "cup", "ball"][card.id % 7];
  const sleepy = motif === "moon";
  const orange = card.id % 3 === 1;
  const body = orange ? "#bd8155" : card.id % 3 === 2 ? "#8b8883" : "#34313a";
  return (
    <svg viewBox="0 0 160 190" className="cat-art" aria-hidden="true">
      <circle
        cx="80"
        cy="102"
        r="63"
        fill={
          motif === "heart"
            ? "#eed4cc"
            : motif === "plant"
              ? "#dde1cf"
              : "#eddfc5"
        }
      />
      <g fill="#9d7d4e">
        <Spark x={24} y={75} size={4} />
        <Spark x={135} y={94} size={5} />
        <Spark x={126} y={157} size={4} />
      </g>
      <Motif type={motif} />
      <ellipse cx="81" cy="174" rx="47" ry="7" fill="#cbb99e" opacity=".45" />
      <path
        d="M103 153c42 13 40-23 23-25-14-1-12 17 1 13"
        fill="none"
        stroke={body}
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M52 167c-5-17 2-41 13-50h31c14 16 19 38 10 50-9 12-47 12-54 0Z"
        fill={body}
      />
      <path
        d="M47 108 43 66l29 19h18l28-19-4 44c-3 40-65 40-67-2Z"
        fill={body}
        stroke="#34313a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="m49 79 4 19 12-7m43-12-4 19-12-7" fill="#d8a49b" opacity=".65" />
      {sleepy ? (
        <g stroke="#f7ecd8" strokeWidth="3.5" fill="none" strokeLinecap="round">
          <path d="M59 110q8 8 15 0m13 0q8 8 15 0" />
        </g>
      ) : (
        <g>
          <ellipse cx="66" cy="110" rx="10" ry="12" fill="#f7ecd8" />
          <ellipse cx="95" cy="110" rx="10" ry="12" fill="#f7ecd8" />
          <ellipse cx="68" cy="111" rx="3" ry="6" fill="#34313a" />
          <ellipse cx="93" cy="111" rx="3" ry="6" fill="#34313a" />
        </g>
      )}
      <path d="m77 122 4 4 4-4Z" fill="#dda79b" />
      <path
        d="M81 126v4m0-1q-4 6-8 0m8 0q4 6 8 0"
        stroke="#f7ecd8"
        fill="none"
        strokeWidth="1.3"
      />
      <path
        d="m53 120-18-3m19 8-20 3m75-8 18-3m-19 8 20 3"
        stroke="#34313a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M66 149v18m28-18v18"
        stroke="#f7ecd8"
        strokeWidth="2"
        opacity=".45"
        strokeLinecap="round"
      />
      <path
        d="m69 137 12 6 12-6"
        stroke="#d9af65"
        strokeWidth="3"
        fill="none"
      />
      <circle cx="81" cy="146" r="4" fill="#d9af65" />
      {orange && (
        <g stroke="#815333" strokeWidth="3" strokeLinecap="round">
          <path d="m75 86 2 9m7-9v9m7-9-2 9" />
        </g>
      )}
    </svg>
  );
}

export function CardFront({ card, position }) {
  const motif = card.motif ?? ["moon", "star", "sun", "heart", "plant", "cup", "ball"][card.id % 7];
  const keyword = card.keyword ?? card.archetype ?? card.meaning ?? "Reflection";
  const number = card.number ?? String(card.id + 1).padStart(2, "0");
  return (
    <div className={`front-design motif-${motif}`}>
      <div className="card-topline">
        <span>{number}</span>
        <span>✦</span>
        <span>MEERA</span>
      </div>
      <CatIllustration card={card} />
      <div className="card-name">{card.name}</div>
      <div className="card-keyword">{keyword}</div>
      <div className="card-bottomline">{position || "A LITTLE PAUSE"}</div>
    </div>
  );
}
