float osc(in float ch) {
  return texture2D(osc_note, vec2(ch / 64.)).r;
}

vec2 rot(in vec2 uv, in float t) {
  float c = cos(t), s = sin(t);
  return mat2(c, -s, s, c) * uv;
}

float blockNoise(in vec2 uv, float t) {
  float n = 0.;
  float k = .8;
  float l = 3.7;
  uv += .3;
  for (int i = 0; i < 3; i++) {
    l += 2.2;
    n += snoise(vec3(floor(uv * l), t)) * k;
    k *= .8;
  }

  return fract(n);
}

vec2 hexCenter(in vec2 p) {
    mat2 skew = mat2(1. / 1.1457, 0, 0.5, 1);
    mat2 inv = 2. * mat2(1., 0, -0.5, 1. / 1.1457);

    vec2 cellP = skew * p;

    // Decide which lane the cell is in
    vec2 cellOrigin = floor(cellP); // -10 to 10, skewed
    float celltype = mod(cellOrigin.x + cellOrigin.y, 3.0);
    vec2 cellCenter = cellOrigin; // -10 to -10, skewed

    if (celltype < 1.) {
        // do nothing
    }
    else if (celltype < 2.) {
        cellCenter = cellOrigin + 1.;
    }
    else if (celltype < 3.) {
        cellP = fract(cellP);
        if (cellP.x > cellP.y) {
            cellCenter = cellOrigin + vec2(1, 0);
        }
        else {
            cellCenter = cellOrigin + vec2(0, 1);
        }
    }

    return inv * (cellCenter / SQRT3);
}
