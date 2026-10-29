import type { InventoryItem } from "@/types/inventory";

type ItemKind =
  | "lcd" | "display" | "keypad" | "board" | "sensor" | "motor" | "servo" | "pump" | "wire" | "printer"
  | "laser" | "machine" | "scanner" | "compressor" | "scale" | "scope" | "lathe" | "sewing" | "instrument"
  | "safety" | "gloves" | "ear" | "apron" | "firstaid" | "workbench" | "pegboard"
  | "caliper" | "micrometer" | "ruler" | "level" | "protractor" | "cuttingmat" | "screwdriver" | "plier"
  | "hammer" | "wrench" | "saw" | "drill" | "blade" | "measure" | "solder"
  | "clamp" | "glue" | "kit" | "tool";

function kindFor(item: InventoryItem): ItemKind {
  const name = `${item.name} ${item.description}`.toLowerCase();
  if (name.includes("lcd")) return "lcd";
  if (/keypad/.test(name)) return "keypad";
  if (/7 segment|8x8|matrix display|led dot matrix|display/.test(name)) return "display";
  if (/arduino|raspberry pi|breadboard|ethernet shield|motor driver|driver shield|toggle switch|mini switches|potentiometer|relay module|battery|buzzer|audio module|audio moudule|\bled\b/.test(name)) return "board";
  if (/sensor|accelerometer|fingerprint|joystick|mp6050|mpu6050|mq[3457]|ldr|gps module|gsm module|rf module|bluetooth|laser module/.test(name)) return "sensor";
  if (/servo/.test(name)) return "servo";
  if (/submersible pump|water pump/.test(name)) return "pump";
  if (/motor|stepper|vibrating|b[o0] motor|gear/.test(name)) return "motor";
  if (/cable|wire|d type/.test(name)) return "wire";
  if (/3d printer|resin printer/.test(name)) return "printer";
  if (/3d scan+n?er|scanner/.test(name)) return "scanner";
  if (/air compresser|air compressor/.test(name)) return "compressor";
  if (/weighing scale/.test(name)) return "scale";
  if (/oscilloscope|osciii/.test(name)) return "scope";
  if (/lathe/.test(name)) return "lathe";
  if (/sewing machine/.test(name)) return "sewing";
  if (/degree protector|protractor/.test(name)) return "protractor";
  if (/inside calliper|outside calliper|digital vernier|caliper|calliper|vernier/.test(name)) return "caliper";
  if (/micrometer/.test(name)) return "micrometer";
  if (/steel rule|ruler/.test(name)) return "ruler";
  if (/spirit level/.test(name)) return "level";
  if (/cutting mat/.test(name)) return "cuttingmat";
  if (/engineering square/.test(name)) return "ruler";
  if (/first aid/.test(name)) return "firstaid";
  if (/glove/.test(name)) return "gloves";
  if (/ear protection/.test(name)) return "ear";
  if (/workshop apron/.test(name)) return "apron";
  if (/esd workstation/.test(name)) return "workbench";
  if (/pegboard/.test(name)) return "pegboard";
  if (/laser/.test(name)) return "laser";
  if (/microscope|multi ?meter|generator|hardness testing|variable power|power supply/.test(name)) return "instrument";
  if (/goggle/.test(name)) return "safety";
  if (/thermo ?cutter|thermocutter/.test(name)) return "machine";
  if (/screw ?driver|bit driver/.test(name)) return "screwdriver";
  if (/plier|cutter|wire stripper|snip/.test(name)) return "plier";
  if (/hammer|mallet/.test(name)) return "hammer";
  if (/spanner|wrench|allen key|circlip/.test(name)) return "wrench";
  if (/hacksaw|jigsaw|table saw|mitre saw|cut.?off saw|circular saw|planer|planner/.test(name)) return "saw";
  if (/bench grinder|bench grander/.test(name)) return "machine";
  if (/drill|impact|dremer|dremel|rotary tool|grinder|sander|blower/.test(name)) return "drill";
  if (/blade|disk|disc|grinding stone|sanding band|sanding disc|polishing|felt wheel|collet|wheel/.test(name)) return "blade";
  if (/measuring tape|meter tape/.test(name)) return "measure";
  if (/solder/.test(name)) return "solder";
  if (/clamp|bench wise|bench vise|pegboard/.test(name)) return "clamp";
  if (/glue gun|heat gun/.test(name)) return "glue";
  if (/cnc|lathe|sewing machine|bender|bending machine|furnace|vinyl cutter|vinile cutter|piller drill|air compresser|air compressor|acrylic|vacuum cleaner|vaccum cleaner|blower|thermocutter/.test(name)) return "machine";
  if (/kit|set|file|chisel|punch|stapler|scissor|knife|pipe cutter|pipe wrench|filter/.test(name)) return "kit";
  return "tool";
}

function ProductDrawing({ kind }: { kind: ItemKind }) {
  const metal = "#c8d1d4";
  const dark = "#25343b";
  const blue = "#26749a";
  const board = "#197657";
  const maroon = "#7b1730";

  switch (kind) {
    case "lcd":
      return <g>
        <rect x="24" y="27" width="112" height="66" rx="8" fill={blue} />
        <circle cx="32" cy="35" r="2.5" fill="#d8e5e4" /><circle cx="128" cy="35" r="2.5" fill="#d8e5e4" />
        <circle cx="32" cy="85" r="2.5" fill="#d8e5e4" /><circle cx="128" cy="85" r="2.5" fill="#d8e5e4" />
        <rect x="41" y="39" width="78" height="38" rx="4" fill="#152d36" stroke="#b9d3c8" strokeWidth="2" />
        <text x="80" y="54" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#b7ed70">16×2 LCD</text>
        <text x="80" y="67" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#b7ed70">HELLO WORLD</text>
        {[48, 58, 68, 78, 88, 98, 108].map((x) => <rect key={x} x={x} y="93" width="3" height="13" rx="1" fill={metal} />)}
      </g>;
    case "display":
      return <g>
        <rect x="29" y="27" width="102" height="66" rx="8" fill={board} />
        <rect x="44" y="37" width="72" height="44" rx="5" fill="#152d36" />
        <text x="80" y="68" textAnchor="middle" fontSize="28" fontWeight="700" fontFamily="monospace" fill="#f15155">8.8</text>
        {[42, 57, 72, 87, 102, 117].map((x) => <rect key={x} x={x} y="94" width="3" height="12" fill={metal} />)}
      </g>;
    case "keypad":
      return <g>
        <rect x="47" y="23" width="66" height="83" rx="9" fill="#252e35" stroke="#67777b" strokeWidth="3" />
        {Array.from({ length: 16 }, (_, index) => {
          const x = 57 + (index % 4) * 14;
          const y = 34 + Math.floor(index / 4) * 16;
          return <rect key={index} x={x} y={y} width="9" height="10" rx="2" fill={index % 4 === 3 ? "#c9a446" : "#dbe2dd"} />;
        })}
        <path d="M54 108h52" stroke="#d7aa49" strokeWidth="3" />
      </g>;
    case "board":
      return <g>
        <rect x="34" y="25" width="92" height="72" rx="8" fill={blue} />
        <rect x="61" y="42" width="32" height="30" rx="3" fill={dark} />
        <rect x="42" y="36" width="14" height="11" rx="2" fill={metal} />
        <rect x="101" y="35" width="16" height="8" rx="2" fill="#d9d9d4" />
        <rect x="100" y="51" width="17" height="24" rx="3" fill="#e3a943" />
        {[42, 52, 62, 72, 82, 92, 102, 112].map((x) => <rect key={x} x={x} y="97" width="2.5" height="10" fill="#d7aa49" />)}
        <circle cx="42" cy="32" r="2" fill="#e7dcb6" /><circle cx="118" cy="90" r="2" fill="#e7dcb6" />
      </g>;
    case "sensor":
      return <g>
        <rect x="38" y="35" width="84" height="56" rx="7" fill={board} />
        <circle cx="80" cy="61" r="17" fill="#243b40" stroke="#c5d6c3" strokeWidth="3" />
        <circle cx="80" cy="61" r="7" fill="#91a7a5" />
        <rect x="48" y="45" width="10" height="7" rx="2" fill="#e3a943" />
        <rect x="102" y="73" width="11" height="7" rx="2" fill="#d9d9d4" />
        {[48, 59, 70, 81, 92, 103, 114].map((x) => <rect key={x} x={x} y="91" width="2.5" height="13" fill="#d7aa49" />)}
      </g>;
    case "motor": case "servo":
      return <g>
        {kind === "servo" ? <><rect x="43" y="36" width="74" height="55" rx="9" fill="#303b43" /><rect x="53" y="46" width="54" height="33" rx="5" fill="#20292e" /><path d="M80 36V24" stroke={metal} strokeWidth="6" /><path d="M68 24h24" stroke="#f1f2e9" strokeWidth="5" strokeLinecap="round" /><path d="M80 91v14m9-14v14m-18-14v14" stroke="#d7aa49" strokeWidth="3" /></>
          : <><rect x="38" y="39" width="74" height="48" rx="15" fill={metal} stroke="#84979b" strokeWidth="3" /><ellipse cx="42" cy="63" rx="8" ry="23" fill="#85959a" /><path d="M112 63h29" stroke="#8c9da2" strokeWidth="8" strokeLinecap="round" /><path d="M56 87v16m14-16v16" stroke="#c78a37" strokeWidth="4" strokeLinecap="round" /><path d="M55 51h39" stroke="#eff2ef" strokeWidth="3" opacity=".75" /></>}
      </g>;
    case "pump":
      return <g>
        <rect x="57" y="49" width="47" height="48" rx="10" fill="#43575d" stroke="#26383e" strokeWidth="3" />
        <path d="M80 49V31h26v12h-15v6" fill="#74878a" stroke="#26383e" strokeWidth="3" strokeLinejoin="round" />
        <path d="M58 68H43v16h14m47-10h15" fill="none" stroke="#a9b5b5" strokeWidth="7" />
        <path d="M69 97v10m23-10v10" stroke="#c38c39" strokeWidth="4" />
      </g>;
    case "wire":
      return <g>
        <circle cx="80" cy="64" r="37" fill="#e2bd57" stroke="#9a7c35" strokeWidth="4" />
        <circle cx="80" cy="64" r="17" fill="#f1eee9" stroke="#9a7c35" strokeWidth="4" />
        <path d="M80 27v20q0 10 10 10h18q16 0 16 14v7" fill="none" stroke="#7b1730" strokeWidth="5" strokeLinecap="round" />
        <path d="M124 78l7 2-4 8" fill="none" stroke="#697a7f" strokeWidth="4" />
      </g>;
    case "scanner":
      return <g>
        <path d="M57 35q0-9 10-9h28q10 0 10 9v51q0 9-10 9H67q-10 0-10-9z" fill="#303c43" />
        <rect x="65" y="39" width="42" height="23" rx="4" fill="#d5e4dd" />
        <circle cx="86" cy="51" r="7" fill="#27343a" /><circle cx="86" cy="51" r="3" fill="#8bb4b5" />
        <path d="M69 69h34" stroke="#91a2a4" strokeWidth="3" />
        <path d="M80 95v12m13-12v12" stroke="#c89942" strokeWidth="4" />
      </g>;
    case "compressor":
      return <g>
        <rect x="32" y="61" width="96" height="34" rx="16" fill="#7b1730" stroke="#531020" strokeWidth="3" />
        <circle cx="54" cy="98" r="7" fill="#29373c" /><circle cx="109" cy="98" r="7" fill="#29373c" />
        <rect x="51" y="38" width="33" height="25" rx="6" fill="#53656a" />
        <circle cx="103" cy="52" r="13" fill="#e8ece8" stroke="#52636a" strokeWidth="4" />
        <path d="M103 52l5-7" stroke="#7b1730" strokeWidth="2" />
        <path d="M65 38V28h31v10" fill="none" stroke="#65777b" strokeWidth="5" />
      </g>;
    case "scale":
      return <g>
        <path d="M51 47h58l-8 49H59z" fill="#53656b" />
        <path d="M41 39h78l-7 12H48z" fill="#b7c2c3" stroke="#687a7d" strokeWidth="3" />
        <rect x="68" y="61" width="24" height="14" rx="3" fill="#d9eadc" />
        <text x="80" y="71" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="#256d51">0.00</text>
        <path d="M64 96v9m32-9v9" stroke="#27363c" strokeWidth="5" />
      </g>;
    case "scope":
      return <g>
        <rect x="33" y="28" width="94" height="70" rx="8" fill="#394c53" />
        <rect x="43" y="38" width="55" height="43" rx="3" fill="#152d36" stroke="#a9b6b4" strokeWidth="2" />
        <path d="M48 61h8l5-12 7 23 7-19 6 8h13" fill="none" stroke="#b7ed70" strokeWidth="2.5" />
        <circle cx="112" cy="45" r="6" fill="#c9d3d2" /><circle cx="112" cy="66" r="6" fill="#d8ab43" />
        <circle cx="112" cy="85" r="4" fill="#dce4df" />
      </g>;
    case "lathe":
      return <g>
        <rect x="33" y="74" width="94" height="18" rx="4" fill="#5a6a6f" />
        <rect x="39" y="43" width="24" height="31" rx="4" fill="#7b1730" />
        <circle cx="51" cy="58" r="9" fill="#bcc7c8" stroke="#4d5d62" strokeWidth="3" />
        <path d="M63 58h45" stroke="#9eabad" strokeWidth="7" />
        <rect x="104" y="45" width="15" height="29" rx="3" fill="#909fa1" />
        <path d="M57 39h11m40 0h13" stroke="#2d3d42" strokeWidth="5" />
      </g>;
    case "sewing":
      return <g>
        <path d="M45 39q0-10 12-10h40q17 0 17 17v25H90V53H64v18H45z" fill="#e8e8e1" stroke="#758387" strokeWidth="4" />
        <path d="M44 72h76v17H44z" fill="#596a70" />
        <path d="M97 45v28m-11 1h22" stroke="#7b1730" strokeWidth="4" />
        <circle cx="104" cy="42" r="7" fill="#cda548" stroke="#78868a" strokeWidth="3" />
        <path d="M71 89v14m36-14v14" stroke="#34454b" strokeWidth="4" />
      </g>;
    case "printer":
      return <g>
        <path d="M38 28h84v70H38z" fill="none" stroke={dark} strokeWidth="7" strokeLinejoin="round" />
        <path d="M47 38h66v52H47z" fill="#f7f6f0" stroke="#b8c3c4" strokeWidth="3" />
        <path d="M60 76h39l-8-14H70z" fill="#7b1730" /><path d="M79 49v10" stroke="#cf573d" strokeWidth="4" />
        <path d="M31 102h98" stroke={dark} strokeWidth="6" strokeLinecap="round" />
      </g>;
    case "laser": case "machine":
      return <g>
        <rect x="34" y="30" width="92" height="68" rx="8" fill={kind === "laser" ? maroon : "#52626a"} />
        <rect x="46" y="40" width="58" height="44" rx="4" fill="#263941" stroke="#bfc9c8" strokeWidth="3" />
        <path d="M57 73h38M75 51v23" stroke="#f05b44" strokeWidth="3" />
        <rect x="108" y="42" width="10" height="8" rx="2" fill="#b7ed70" />
        <path d="M44 99h72" stroke="#25343b" strokeWidth="6" strokeLinecap="round" />
      </g>;
    case "instrument":
      return <g>
        <rect x="53" y="25" width="54" height="78" rx="10" fill="#4a5a61" />
        <rect x="62" y="36" width="36" height="24" rx="3" fill="#c8dfd1" />
        <path d="M68 52h6v-7h6v7h6v-10" fill="none" stroke="#21694e" strokeWidth="2" />
        <circle cx="80" cy="76" r="10" fill="#242f34" stroke="#c0c7c4" strokeWidth="2" />
        <path d="M80 76l6-6" stroke="#ed7659" strokeWidth="2" />
        <path d="M66 103l-7 8m35-8 7 8" stroke="#d34d43" strokeWidth="4" />
      </g>;
    case "safety":
      return <g>
        <path d="M37 56q0-24 24-24h38q24 0 24 24v17H37z" fill="#d9a843" stroke="#9d7737" strokeWidth="3" />
        <path d="M48 55q0-14 13-14h15v24H48zm64 0q0-14-13-14H84v24h28z" fill="#dce8e4" stroke="#46565a" strokeWidth="3" />
        <path d="M76 54h8" stroke="#46565a" strokeWidth="4" />
        <path d="M48 80h64" stroke="#7b1730" strokeWidth="5" strokeLinecap="round" />
      </g>;
    case "gloves":
      return <g>
        <path d="M47 82V45q0-6 6-6t6 6v17-28q0-6 6-6t6 6v27-31q0-6 6-6t6 6v31-26q0-6 6-6t6 6v34q0 28-22 28H62q-15 0-15-15z" fill="#d8b04d" stroke="#846b38" strokeWidth="3" />
        <path d="M90 73l11-12q5-5 9 0 3 4 0 8L96 88" fill="#d8b04d" stroke="#846b38" strokeWidth="3" />
        <path d="M48 84q15 9 38 2" stroke="#f0d880" strokeWidth="3" />
      </g>;
    case "ear":
      return <g>
        <path d="M47 69V57q0-34 33-34t33 34v12" fill="none" stroke="#394c53" strokeWidth="9" />
        <rect x="39" y="61" width="22" height="36" rx="9" fill="#d7a741" stroke="#765c2b" strokeWidth="3" />
        <rect x="99" y="61" width="22" height="36" rx="9" fill="#d7a741" stroke="#765c2b" strokeWidth="3" />
        <rect x="44" y="68" width="12" height="21" rx="5" fill="#f1d375" />
        <rect x="104" y="68" width="12" height="21" rx="5" fill="#f1d375" />
      </g>;
    case "apron":
      return <g>
        <path d="M61 36q0-10 19-10t19 10l10 13 8 51H43l8-51z" fill="#7b1730" stroke="#531020" strokeWidth="3" />
        <path d="M63 31l-8 23h50l-8-23" fill="none" stroke="#b96d7a" strokeWidth="5" />
        <path d="M55 70h50v18H55z" fill="#a94d61" />
        <path d="M60 51L45 43m55 8 15-16" stroke="#80515a" strokeWidth="4" />
      </g>;
    case "firstaid":
      return <g>
        <rect x="39" y="41" width="82" height="58" rx="9" fill="#f4f4ee" stroke="#8a9999" strokeWidth="3" />
        <path d="M65 41v-9q0-5 6-5h18q6 0 6 5v9" fill="none" stroke="#697a7f" strokeWidth="5" />
        <rect x="73" y="53" width="14" height="35" rx="2" fill="#c84143" />
        <rect x="62" y="64" width="36" height="14" rx="2" fill="#c84143" />
      </g>;
    case "workbench":
      return <g>
        <path d="M31 52h98v11H31z" fill="#384950" />
        <path d="M42 63h12v40H42zm64 0h12v40h-12z" fill="#7b1730" />
        <rect x="53" y="37" width="55" height="15" rx="3" fill="#4e846c" />
        <path d="M62 31v6m36-6v6" stroke="#293b40" strokeWidth="4" />
        <circle cx="80" cy="44" r="3" fill="#b7ed70" />
      </g>;
    case "pegboard":
      return <g>
        <rect x="38" y="25" width="84" height="78" rx="5" fill="#d8d3ca" stroke="#7a8583" strokeWidth="3" />
        {[0,1,2,3,4].map((row) => [0,1,2,3,4].map((col) => <circle key={`${row}-${col}`} cx={52+col*14} cy={38+row*13} r="2.1" fill="#7f8987" />))}
        <path d="M62 48v24q0 7 6 7h5m16-28v17q0 6 6 6h4m-36 8v9m31-20v20" fill="none" stroke="#7b1730" strokeWidth="3" strokeLinecap="round" />
        <path d="M84 48v10l-5 5m25 1v15" fill="none" stroke="#697a7f" strokeWidth="3" />
      </g>;
    case "caliper":
      return <g>
        <path d="M34 54h92v10H34z" fill="#aebabc" stroke="#65767a" strokeWidth="2" />
        <path d="M45 54V36h9v35h-9m68-17V36h-9v35h9" fill="none" stroke="#65767a" strokeWidth="4" strokeLinejoin="round" />
        <rect x="72" y="48" width="25" height="22" rx="4" fill="#283b40" />
        <rect x="76" y="53" width="17" height="9" rx="2" fill="#c7e1cf" />
        <path d="M40 64v11m12-11v7m10-7v7m10-7v7m10-7v7m10-7v7m10-7v7m10-7v7m10-11v11" stroke="#637478" strokeWidth="2" />
      </g>;
    case "micrometer":
      return <g>
        <path d="M54 44q0-15 16-15h15q15 0 15 15v13H85V45H69v22h31v15q0 11-12 11H58q-13 0-13-14V44z" fill="#bdc7c8" stroke="#66777b" strokeWidth="4" />
        <path d="M69 52h27" stroke="#65767a" strokeWidth="5" />
        <path d="M95 48h23v12H95" fill="#d1ab58" stroke="#85703e" strokeWidth="3" />
        <path d="M60 93v11m11-11v11" stroke="#394c53" strokeWidth="4" />
      </g>;
    case "ruler":
      return <g>
        <rect x="38" y="43" width="84" height="35" rx="4" fill="#d9b253" stroke="#9c7e3c" strokeWidth="3" />
        <path d="M47 44v17m10-17v10m10-10v17m10-17v10m10-10v17m10-17v10m10-10v17m10-17v10" stroke="#4a5351" strokeWidth="2" />
        <text x="81" y="72" textAnchor="middle" fontSize="7" fontFamily="sans-serif" fill="#61532d">300 mm</text>
      </g>;
    case "level":
      return <g>
        <rect x="34" y="45" width="92" height="32" rx="6" fill="#d7a93e" stroke="#8d6f2e" strokeWidth="3" />
        <rect x="63" y="51" width="35" height="20" rx="10" fill="#e8eee8" stroke="#6f817f" strokeWidth="2" />
        <path d="M77 61h8" stroke="#6d996f" strokeWidth="4" strokeLinecap="round" />
        <path d="M43 52v18m8-18v12m55-12v12m8-12v18" stroke="#5a5e52" strokeWidth="2" />
      </g>;
    case "protractor":
      return <g>
        <path d="M37 89a43 43 0 0 1 86 0z" fill="#cbe0dc" stroke="#5f8183" strokeWidth="3" />
        <path d="M49 88a31 31 0 0 1 62 0" fill="#eef2ed" stroke="#8da6a4" strokeWidth="2" />
        {[0,30,60,90,120,150,180].map((deg) => <path key={deg} d="M80 87v-8" stroke="#586b6d" strokeWidth="2" transform={`rotate(${deg-90} 80 88)`} />)}
        <circle cx="80" cy="88" r="3" fill="#7b1730" />
      </g>;
    case "cuttingmat":
      return <g>
        <rect x="35" y="29" width="90" height="70" rx="5" fill="#477c68" stroke="#315c4d" strokeWidth="3" />
        <path d="M46 40h68v48H46zM46 52h68M46 64h68M46 76h68M58 40v48m12-48v48m12-48v48m12-48v48" fill="none" stroke="#b7d5b9" strokeWidth="1" opacity=".8" />
        <path d="M53 82l41-41" stroke="#e8d36d" strokeWidth="2" />
      </g>;
    case "screwdriver":
      return <g transform="rotate(-28 80 64)">
        <rect x="69" y="26" width="22" height="53" rx="9" fill="#7b1730" />
        <rect x="76" y="76" width="8" height="34" fill={metal} />
        <path d="M80 109v9" stroke="#929da0" strokeWidth="3" />
        <path d="M72 36h16" stroke="#aa6a72" strokeWidth="3" />
      </g>;
    case "plier":
      return <g>
        <path d="M52 36l25 29-23 39" fill="none" stroke="#52626a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M108 36L83 65l23 39" fill="none" stroke="#7b1730" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="80" cy="65" r="10" fill="#d5a544" stroke="#52626a" strokeWidth="3" />
        <path d="M51 36l-7-15m64 15 7-15" stroke="#52626a" strokeWidth="7" strokeLinecap="round" />
      </g>;
    case "hammer":
      return <g transform="rotate(35 80 63)">
        <rect x="74" y="48" width="12" height="60" rx="5" fill="#90603c" />
        <path d="M49 30h62v19H49z" rx="5" fill={metal} stroke="#76868a" strokeWidth="3" />
        <path d="M49 30h19v19H49z" fill="#87979a" />
      </g>;
    case "wrench":
      return <g transform="rotate(-35 80 65)">
        <path d="M80 37v66" stroke={metal} strokeWidth="15" strokeLinecap="round" />
        <path d="M67 40q-9-21 8-28l2 17 8 4 9-5 1-17q18 9 8 29l-13 11H79z" fill="#9daeb1" stroke="#65777b" strokeWidth="3" />
        <circle cx="80" cy="102" r="8" fill="#eff1ed" stroke="#718186" strokeWidth="3" />
      </g>;
    case "saw":
      return <g>
        <path d="M36 53h83l-10 31H36z" fill={metal} stroke="#6c7b80" strokeWidth="3" />
        <path d="M44 84l7 8 7-8 7 8 7-8 7 8 7-8 7 8 7-8 7 8 7-8" fill="#f8f7f2" stroke="#6c7b80" strokeWidth="2" />
        <rect x="33" y="43" width="32" height="39" rx="7" fill="#7b1730" />
        <path d="M39 50h18" stroke="#bd7d86" strokeWidth="3" />
      </g>;
    case "drill":
      return <g>
        <path d="M46 42q0-11 12-11h48q15 0 15 14v21H82v27H61V66H46z" fill="#d8ab3f" stroke="#906e2f" strokeWidth="3" />
        <rect x="119" y="48" width="19" height="9" rx="2" fill={metal} />
        <path d="M70 86v25h18V86" fill="#34454c" />
        <rect x="54" y="42" width="24" height="15" rx="3" fill="#343e42" />
      </g>;
    case "blade":
      return <g>
        <circle cx="80" cy="64" r="39" fill="#bbc5c8" stroke="#68797e" strokeWidth="4" />
        <circle cx="80" cy="64" r="8" fill="#f4f1ea" stroke="#68797e" strokeWidth="3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => <path key={deg} d="M80 25l-6 10h12z" fill="#eef0eb" stroke="#7a8a8e" strokeWidth="1" transform={`rotate(${deg} 80 64)`} />)}
      </g>;
    case "measure":
      return <g>
        <path d="M44 35h59l13 13v37l-13 13H44z" fill="#d6a83e" stroke="#9c7937" strokeWidth="3" />
        <path d="M53 51h51" stroke="#fff8da" strokeWidth="4" />
        {[60, 70, 80, 90, 100].map((x) => <path key={x} d={`M${x} 51v${x % 20 === 0 ? 11 : 7}`} stroke="#555d5d" strokeWidth="2" />)}
        <circle cx="81" cy="67" r="10" fill="#fff4cf" stroke="#8c723e" strokeWidth="3" />
      </g>;
    case "solder":
      return <g>
        <rect x="39" y="35" width="82" height="54" rx="8" fill="#394d54" />
        <rect x="49" y="45" width="32" height="21" rx="3" fill="#b9d4c7" />
        <circle cx="101" cy="57" r="8" fill="#c9d1d2" />
        <path d="M91 89l-10 19-6-4 7-20" fill="#bd9c68" />
        <path d="M72 106l-4 9" stroke="#87979a" strokeWidth="3" />
      </g>;
    case "clamp":
      return <g>
        <path d="M54 37h48q15 0 15 14v16q0 14-15 14H54" fill="none" stroke="#59696e" strokeWidth="10" strokeLinecap="round" />
        <path d="M52 37v52" stroke="#7b1730" strokeWidth="9" strokeLinecap="round" />
        <path d="M47 36h26m20 48h30" stroke="#c0c9ca" strokeWidth="8" strokeLinecap="round" />
        <path d="M76 91v17" stroke="#c7983e" strokeWidth="5" />
      </g>;
    case "glue":
      return <g>
        <path d="M50 36h42l11 13v28H50z" fill="#d4a63e" stroke="#907235" strokeWidth="3" />
        <path d="M59 77h25v29H59z" fill="#3d4e53" />
        <path d="M91 44l37 21-5 8-36-19" fill="#818e90" />
        <path d="M127 65l13 5-11 5" fill="#c8a56c" />
      </g>;
    case "kit":
      return <g>
        <rect x="35" y="40" width="90" height="58" rx="8" fill="#7b1730" />
        <path d="M35 56h90" stroke="#b56a77" strokeWidth="4" />
        <path d="M65 41v-9h30v9" fill="none" stroke="#59696e" strokeWidth="6" />
        <rect x="49" y="68" width="16" height="21" rx="3" fill="#d9b250" />
        <rect x="73" y="68" width="12" height="21" rx="2" fill="#c4d0d0" />
        <rect x="94" y="68" width="16" height="21" rx="3" fill="#7fa2a3" />
      </g>;
    default:
      return <g>
        <rect x="37" y="31" width="86" height="65" rx="9" fill="#697a7f" />
        <rect x="49" y="43" width="62" height="42" rx="5" fill="#d9e0db" />
        <path d="M57 74l14-17 13 12 10-9 10 12" fill="none" stroke={maroon} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M47 99h66" stroke="#25343b" strokeWidth="5" strokeLinecap="round" />
      </g>;
  }
}

export function InventoryItemImage({ item }: { item: InventoryItem }) {
  const kind = kindFor(item);
  return (
    <svg
      viewBox="0 0 160 120"
      role="img"
      aria-label={`${item.name} illustration`}
      className="size-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="160" height="120" rx="12" fill="#f1eee9" />
      <ellipse cx="80" cy="105" rx="48" ry="5" fill="#d7d0c7" opacity=".7" />
      <ProductDrawing kind={kind} />
    </svg>
  );
}
