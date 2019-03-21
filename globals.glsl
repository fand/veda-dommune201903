float beat;
float loopLength;
float v;

float o0;
float o1;
float o2;
float o3;
float o4;
float o5;
float o6;
float o7;

float o16;
float o17;
float o18;
float o19;
float o20;
float o21;
float o22;
float o23;
float o24;
float o25;
float o26;
float o27;
float o28;
float o29;
float o30;

float o48;
float o49;
float o50;
float o51;
float o52;
float o53;
float o54;
float o55;
float o56;
float o57;
float m0;
float m1;
float m2;
float m3;
float m4;
float m5;
float m6;
float m7;

void initGlobals() {
  beat = texture2D(osc_beat, vec2(0)).r;
  loopLength = texture2D(osc_beat, vec2(1)).r;
  v = volume * knob(7.);

  // For pre fx
  o0 = osc(0.);
  o1 = osc(1.);
  o2 = osc(2.);
  o3 = osc(3.);
  o4 = osc(4.);
  o5 = osc(5.);
  o6 = osc(6.);
  o7 = osc(7.);

  // For post fx
  o16 = osc(16.);
  o17 = osc(17.);
  o18 = osc(18.);
  o19 = osc(19.);
  o20 = osc(20.);
  o21 = osc(21.);
  o22 = osc(22.);
  o23 = osc(23.);
  o24 = osc(24.);
  o25 = osc(25.);
  o26 = osc(26.);
  o27 = osc(27.);
  o28 = osc(28.);
  o29 = osc(29.);
  o30 = osc(30.);

  // For draw
  o48 = osc(48.);
  o49 = osc(49.);
  o50 = osc(50.);
  o51 = osc(51.);
  o52 = osc(52.);
  o53 = osc(53.);
  o54 = osc(54.);
  o55 = osc(55.);
  o56 = osc(56.);
  o57 = osc(57.);

  m0 = cc(0.);
  m1 = cc(1.);
  m2 = cc(2.);
  m3 = cc(3.);
  m4 = cc(4.);
  m5 = cc(5.);
  m6 = cc(6.);
  m7 = cc(7.);
}
