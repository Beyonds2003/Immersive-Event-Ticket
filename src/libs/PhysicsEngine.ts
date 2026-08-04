let e = 0;
let t = 0;
let n = 0;
let r = 1;

function i(
  e_val: number,
  t_val: number,
  n_val: number,
  r_val: number,
  i_val: number,
  a_val: number,
  o_val: number,
  s_val: number
) {
  return e_val * i_val + t_val * a_val + n_val * o_val + r_val * s_val;
}

function a() {
  let i_val = Math.sqrt(e * e + t * t + n * n + r * r);
  if (i_val > 1e-5) {
    let a_val = 1 / i_val;
    e *= a_val;
    t *= a_val;
    n *= a_val;
    r *= a_val;
  }
}

function o(
  i_val: number,
  o_val: number,
  s_val: number,
  c_val: number,
  l_val: number,
  u_val: number
) {
  let d = i_val * c_val + o_val * l_val + s_val * u_val + 1;
  if (d < 1e-6) {
    d = 0;
    if (Math.abs(i_val) > Math.abs(s_val)) {
      e = -o_val;
      t = i_val;
      n = 0;
    } else {
      e = 0;
      t = -s_val;
      n = o_val;
    }
  } else {
    e = o_val * u_val - s_val * l_val;
    t = s_val * c_val - i_val * u_val;
    n = i_val * l_val - o_val * c_val;
  }
  r = d;
  a();
}

function s(i_val: number, a_val: number, o_val: number, s_val: number) {
  let c_val = s_val * 0.5;
  let l_val = Math.sin(c_val);
  e = i_val * l_val;
  t = a_val * l_val;
  n = o_val * l_val;
  r = Math.cos(c_val);
}

function c(
  i_val: number,
  o_val: number,
  s_val: number,
  c_val: number,
  l_val: number,
  u_val: number,
  d_val: number,
  f_val: number,
  p_val: number
) {
  let m_val = i_val * l_val + o_val * u_val + s_val * d_val + c_val * f_val;
  if (m_val < 0) {
    l_val = -l_val;
    u_val = -u_val;
    d_val = -d_val;
    f_val = -f_val;
    m_val = -m_val;
  }
  if (m_val >= 1) {
    e = i_val;
    t = o_val;
    n = s_val;
    r = c_val;
    return;
  }
  let h_val = 1 - m_val * m_val;
  if (h_val <= 0.001) {
    let m_val2 = 1 - p_val;
    e = m_val2 * i_val + p_val * l_val;
    t = m_val2 * o_val + p_val * u_val;
    n = m_val2 * s_val + p_val * d_val;
    r = m_val2 * c_val + p_val * f_val;
    a();
    return;
  }
  let g_val = Math.sqrt(h_val);
  let _val = Math.atan2(g_val, m_val);
  let v_val = Math.sin((1 - p_val) * _val) / g_val;
  let y_val = Math.sin(p_val * _val) / g_val;
  e = i_val * v_val + l_val * y_val;
  t = o_val * v_val + u_val * y_val;
  n = s_val * v_val + d_val * y_val;
  r = c_val * v_val + f_val * y_val;
}

let l = 0;
let u = 0;
let d = 0;

function f(
  e_val: number,
  t_val: number,
  n_val: number,
  r_val: number,
  i_val: number,
  a_val: number,
  o_val: number
) {
  let s_val = o_val * e_val + i_val * n_val - a_val * t_val;
  let c_val = o_val * t_val + a_val * e_val - r_val * n_val;
  let f_val = o_val * n_val + r_val * t_val - i_val * e_val;
  let p_val = -r_val * e_val - i_val * t_val - a_val * n_val;
  l = s_val * o_val - p_val * r_val - c_val * a_val + f_val * i_val;
  u = c_val * o_val - p_val * i_val - f_val * r_val + s_val * a_val;
  d = f_val * o_val - p_val * a_val - s_val * i_val + c_val * r_val;
}

let p = new Float32Array(16);

function m(
  e_arr: Float32Array,
  t_idx: number,
  n_val: number,
  r_val: number,
  i_val: number,
  a_val: number
) {
  let o_val = n_val * n_val;
  let s_val = r_val * r_val;
  let c_val = i_val * i_val;
  let l_val = n_val * r_val;
  let u_val = n_val * i_val;
  let d_val = r_val * i_val;
  let f_val = a_val * n_val;
  let p_val = a_val * r_val;
  let m_val = a_val * i_val;
  e_arr[t_idx] = 1 - 2 * (s_val + c_val);
  e_arr[t_idx + 1] = 2 * (l_val + m_val);
  e_arr[t_idx + 2] = 2 * (u_val - p_val);
  e_arr[t_idx + 3] = 0;
  e_arr[t_idx + 4] = 2 * (l_val - m_val);
  e_arr[t_idx + 5] = 1 - 2 * (o_val + c_val);
  e_arr[t_idx + 6] = 2 * (d_val + f_val);
  e_arr[t_idx + 7] = 0;
  e_arr[t_idx + 8] = 2 * (u_val + p_val);
  e_arr[t_idx + 9] = 2 * (d_val - f_val);
  e_arr[t_idx + 10] = 1 - 2 * (o_val + s_val);
  e_arr[t_idx + 11] = 0;
  e_arr[t_idx + 12] = 0;
  e_arr[t_idx + 13] = 0;
  e_arr[t_idx + 14] = 0;
  e_arr[t_idx + 15] = 1;
}

function h(e_arr: Float32Array, t_idx: number, n_arr: Float32Array) {
  for (let n_idx = 0; n_idx < 16; n_idx++) {
    p[n_idx] = e_arr[t_idx + n_idx];
  }
  for (let r_idx = 0; r_idx < 4; r_idx++) {
    let i_idx = r_idx * 4;
    for (let r_inner = 0; r_inner < 4; r_inner++) {
      e_arr[t_idx + i_idx + r_inner] =
        p[r_inner] * n_arr[i_idx] +
        p[r_inner + 4] * n_arr[i_idx + 1] +
        p[r_inner + 8] * n_arr[i_idx + 2] +
        p[r_inner + 12] * n_arr[i_idx + 3];
    }
  }
}

function g(e_arr: Float32Array, t_idx: number, n_arr: Float32Array) {
  for (let n_idx = 0; n_idx < 16; n_idx++) {
    p[n_idx] = e_arr[t_idx + n_idx];
  }
  for (let r_idx = 0; r_idx < 4; r_idx++) {
    let i_idx = r_idx * 4;
    for (let r_inner = 0; r_inner < 4; r_inner++) {
      e_arr[t_idx + i_idx + r_inner] =
        n_arr[r_inner] * p[i_idx] +
        n_arr[r_inner + 4] * p[i_idx + 1] +
        n_arr[r_inner + 8] * p[i_idx + 2] +
        n_arr[r_inner + 12] * p[i_idx + 3];
    }
  }
}

const v_const = 2048;
const y_const = 16384;

export class SpatialGrid {
  _cellSize = 1.5;
  _invCell = 1 / 1.5;
  _head = new Int32Array(v_const);
  _gridEntriesBall = new Int32Array(y_const);
  _gridEntriesNext = new Int32Array(y_const);
  _entryCount = 0;
  _pairs = new Int32Array(32768);
  _pairsCount = 0;
  _pairGen = new Uint32Array(320 * 320);
  _dedupGen = 0;

  clear() {
    this._head.fill(-1);
    this._entryCount = 0;
    this._pairsCount = 0;
  }

  insert(e_state: Float32Array, t_idx: number) {
    let n_offset = t_idx * 128;
    let r_inv = this._invCell;
    let i_x = e_state[n_offset + 0];
    let a_y = e_state[n_offset + 1];
    let o_z = e_state[n_offset + 2];
    let s_rad = e_state[n_offset + 9]; // radius
    let c_minX = Math.floor((i_x - s_rad) * r_inv);
    let l_maxX = Math.floor((i_x + s_rad) * r_inv);
    let u_minY = Math.floor((a_y - s_rad) * r_inv);
    let d_maxY = Math.floor((a_y + s_rad) * r_inv);
    let f_minZ = Math.floor((o_z - s_rad) * r_inv);
    let p_maxZ = Math.floor((o_z + s_rad) * r_inv);
    let m_head = this._head;
    let h_ball = this._gridEntriesBall;
    let g_next = this._gridEntriesNext;

    for (let x_cell = c_minX; x_cell <= l_maxX; x_cell++) {
      for (let y_cell = u_minY; y_cell <= d_maxY; y_cell++) {
        for (let z_cell = f_minZ; z_cell <= p_maxZ; z_cell++) {
          let i_hash =
            ((x_cell * 73856093) ^ (y_cell * 19349663) ^ (z_cell * 83492791) |
              0) &
            2047;
          let a_entry = this._entryCount;
          if (a_entry >= y_const) continue;
          h_ball[a_entry] = t_idx;
          g_next[a_entry] = m_head[i_hash];
          m_head[i_hash] = a_entry;
          this._entryCount++;
        }
      }
    }
  }

  getPotentialPairs(e_state: Float32Array) {
    this._dedupGen++;
    let t_gen = this._dedupGen;
    let n_genArray = this._pairGen;
    let r_pairsArray = this._pairs;
    let i_count = 0;
    let a_head = this._head;
    let o_ball = this._gridEntriesBall;
    let s_next = this._gridEntriesNext;

    for (let c_idx = 0; c_idx < v_const; c_idx++) {
      let l_entry = a_head[c_idx];
      while (l_entry !== -1) {
        let a_ballIdx = o_ball[l_entry];
        let c_groupId = e_state[a_ballIdx * 128 + 25]; // group / ID
        if (c_groupId === -1) {
          l_entry = s_next[l_entry];
          continue;
        }
        let u_entry = s_next[l_entry];
        while (u_entry !== -1) {
          let l_otherBall = o_ball[u_entry];
          let d_otherGroup = e_state[l_otherBall * 128 + 25];
          if (d_otherGroup === -1) {
            u_entry = s_next[u_entry];
            continue;
          }
          let f_minGroup = c_groupId < d_otherGroup ? c_groupId : d_otherGroup;
          let p_maxGroup = c_groupId < d_otherGroup ? d_otherGroup : c_groupId;
          let m_pairKey = f_minGroup * 320 + p_maxGroup;
          if (n_genArray[m_pairKey] !== t_gen) {
            n_genArray[m_pairKey] = t_gen;
            r_pairsArray[i_count++] = a_ballIdx;
            r_pairsArray[i_count++] = l_otherBall;
          }
          u_entry = s_next[u_entry];
        }
        l_entry = s_next[l_entry];
      }
    }
    this._pairsCount = i_count;
    return r_pairsArray;
  }
}

let _ = new Float32Array(16);

export class PhysicsEngine {
  _maxBalls: number;
  _grid: SpatialGrid;
  _affecting = new Int32Array(32);
  _affectingCount = 0;
  _activePanelPairs = new Int32Array(8192);
  _activePanelPairsCount = 0;

  constructor(maxBalls: number) {
    this._maxBalls = maxBalls;
    this._grid = new SpatialGrid();
  }

  step(ballState: Float32Array, input: Float32Array) {
    input[23] = 0;
    input[24] = 0;
    input[25] = 0;
    input[27] = 0;
    input[26] = 0;

    let n_balls = input[0] | 0; // active balls count
    let r_steps = input[1] | 0; // substeps count
    if (n_balls === 0 || r_steps === 0) return;

    let i_start = performance.now();
    for (let idx = 0; idx < r_steps; idx++) {
      this._stepOnce(ballState, input, n_balls);
    }
    this._computeMatrices(ballState, input, n_balls);
    this._computeEyeSprings(ballState, n_balls);
    input[26] = performance.now() - i_start;
  }

  initialSeparation(
    ballState: Float32Array,
    input: Float32Array,
    maxIter = 100
  ) {
    let r_balls = input[0] | 0;
    let i_limit = input[21];
    for (
      let a = 0;
      a < maxIter &&
      !(this._solveCollisionsOnce(ballState, input, r_balls) < i_limit);
      a++
    ) {
      // separation loop
    }
    for (let t_ball = 0; t_ball < r_balls; t_ball++) {
      let n_offset = t_ball * 128;
      ballState[n_offset + 6] = ballState[n_offset + 0];
      ballState[n_offset + 7] = ballState[n_offset + 1];
      ballState[n_offset + 8] = ballState[n_offset + 2];
    }
  }

  _stepOnce(ballState: Float32Array, input: Float32Array, n: number) {
    let r_colliderCheck = input[17] > 0;
    if (r_colliderCheck)
      this._adjustTargetsForColliders(ballState, input, n);
    this._applyLayoutForces(ballState, input, n);
    if (r_colliderCheck) this._restoreTargets(ballState, n);
    this._applyMouseForce(ballState, input, n);
    this._applyForcePoints(ballState, input, n);
    if (this._integrate(ballState, input, n) || input[9] > 5e-4) {
      this._solveCollisionsOnce(ballState, input, n);
    }
    if (r_colliderCheck)
      this._correctPositionsForColliders(ballState, input, n);
    this._clampMinY(ballState, n);
    this._updateSoftBodies(ballState, input, n);
  }

  _applyLayoutForces(
    ballState: Float32Array,
    input: Float32Array,
    n: number
  ) {
    let r_coeff = input[16];
    let maxThreshold = input[30] || 0;
    let tetherStiffness = input[31] || 0.02;

    for (let t_ball = 0; t_ball < n; t_ball++) {
      let n_offset = t_ball * 128;
      if (!(ballState[n_offset + 24] & 5)) {
        let dxTarget = ballState[n_offset + 6] - ballState[n_offset + 0];
        let dyTarget = ballState[n_offset + 7] - ballState[n_offset + 1];
        let dzTarget = ballState[n_offset + 8] - ballState[n_offset + 2];

        if (r_coeff !== 0) {
          ballState[n_offset + 3] += dxTarget * r_coeff;
          ballState[n_offset + 4] += dyTarget * r_coeff;
          ballState[n_offset + 5] += dzTarget * r_coeff;
        }

        if (maxThreshold > 0) {
          let distSq =
            dxTarget * dxTarget + dyTarget * dyTarget + dzTarget * dzTarget;
          let dist = Math.sqrt(distSq);
          if (dist > maxThreshold) {
            let over = dist - maxThreshold;
            let invDist = 1 / (dist || 0.001);
            let nx = dxTarget * invDist;
            let ny = dyTarget * invDist;
            let nz = dzTarget * invDist;

            let pull = tetherStiffness * Math.min(over, maxThreshold * 2);
            ballState[n_offset + 3] += nx * pull;
            ballState[n_offset + 4] += ny * pull;
            ballState[n_offset + 5] += nz * pull;

            let dampFactor = 1 - Math.min(0.2, over * 0.05);
            ballState[n_offset + 3] *= dampFactor;
            ballState[n_offset + 4] *= dampFactor;
            ballState[n_offset + 5] *= dampFactor;
          }
        }
      }
    }
  }

  _applyMouseForce(ballState: Float32Array, input: Float32Array, n: number) {
    let r_force = input[9];
    if (r_force < 5e-4) return;
    let i_mx = input[2];
    let a_my = input[3];
    let o_cos = input[4];
    let s_sin = input[5];
    let c_radius = input[8];
    let maxThreshold = input[30] || 0;

    for (let t_ball = 0; t_ball < n; t_ball++) {
      let n_offset = t_ball * 128;
      if (ballState[n_offset + 24] & 4) continue;
      let l_projX =
        ballState[n_offset + 0] * o_cos + ballState[n_offset + 2] * s_sin;
      let u_projY = ballState[n_offset + 1];
      let d_dx = l_projX - i_mx;
      let f_dy = u_projY - a_my;
      let p_distSq = d_dx * d_dx + f_dy * f_dy;
      let m_maxDist = c_radius + ballState[n_offset + 9];
      if (p_distSq < m_maxDist * m_maxDist && p_distSq > 1e-4) {
        let t_dist = Math.sqrt(p_distSq);
        let i_ratio = 1 - t_dist / m_maxDist;
        let a_coef = i_ratio * i_ratio * (3 - 2 * i_ratio);

        if (maxThreshold > 0) {
          let dxT = ballState[n_offset + 0] - ballState[n_offset + 6];
          let dyT = ballState[n_offset + 1] - ballState[n_offset + 7];
          let dzT = ballState[n_offset + 2] - ballState[n_offset + 8];
          let distFromAnchor = Math.sqrt(dxT * dxT + dyT * dyT + dzT * dzT);
          let thresholdStart = maxThreshold * 0.7;
          if (distFromAnchor > thresholdStart) {
            let fadeRange = maxThreshold * 0.5 || 1;
            let fade =
              1 -
              Math.min(
                1,
                Math.max(0, (distFromAnchor - thresholdStart) / fadeRange)
              );
            a_coef *= Math.max(0, fade);
          }
        }

        if (a_coef > 0.15) {
          ballState[n_offset + 112] = 1;
        }
        let c_force = a_coef * r_force * ballState[n_offset + 11];
        let l_fx = (d_dx / t_dist) * c_force;
        let u_fy = (f_dy / t_dist) * c_force;
        ballState[n_offset + 3] += l_fx * o_cos;
        ballState[n_offset + 4] += u_fy;
        ballState[n_offset + 5] += l_fx * s_sin;
        let h_damp = 1 - a_coef * 0.15;
        ballState[n_offset + 3] *= h_damp;
        ballState[n_offset + 4] *= h_damp;
        ballState[n_offset + 5] *= h_damp;
      }
    }
  }

  _applyForcePoints(
    ballState: Float32Array,
    input: Float32Array,
    n: number
  ) {
    let r_pts = input[97] | 0;
    if (r_pts === 0) return;
    let i_cos = input[4];
    let a_sin = input[5];
    for (let o_idx = 0; o_idx < r_pts; o_idx++) {
      let r_offset = 98 + o_idx * 9;
      let s_fpx = input[r_offset];
      let c_fpy = input[r_offset + 1];
      let l_strength = input[r_offset + 8];
      let u_val = input[r_offset + 3];
      let d_val = input[r_offset + 4];
      let f_val = input[r_offset + 6];
      let p_val = input[r_offset + 7];
      if (l_strength < 0.01) continue;
      let m_decay = 1;
      if (p_val > d_val) {
        let e_ratio = (p_val - d_val) / f_val;
        m_decay = 1 - e_ratio * e_ratio;
      }
      for (let t_ball = 0; t_ball < n; t_ball++) {
        let n_offset = t_ball * 128;
        if (ballState[n_offset + 24] & 7) continue;
        let r_projX =
          ballState[n_offset + 0] * i_cos + ballState[n_offset + 2] * a_sin;
        let o_projY = ballState[n_offset + 1];
        let d_dx = r_projX - s_fpx;
        let f_dy = o_projY - c_fpy;
        let p_distSq = d_dx * d_dx + f_dy * f_dy;
        if (p_distSq < 1e-4) continue;
        let h_maxD = l_strength + ballState[n_offset + 9];
        if (p_distSq > h_maxD * h_maxD) continue;
        let g_dist = Math.sqrt(p_distSq);
        let _ratio = 1 - g_dist / h_maxD;
        let v_force = _ratio * _ratio * (3 - 2 * _ratio) * u_val * m_decay;
        let y_fx = (d_dx / g_dist) * v_force;
        let b_fy = (f_dy / g_dist) * v_force;
        ballState[n_offset + 3] += y_fx * i_cos;
        ballState[n_offset + 4] += b_fy;
        ballState[n_offset + 5] += y_fx * a_sin;
      }
    }
  }

  _integrate(ballState: Float32Array, input: Float32Array, n: number) {
    let r_dt = input[11];
    let i_maxSpeedSq = r_dt * r_dt;
    let a_damping = input[6];
    let o_moved = false;
    for (let t_ball = 0; t_ball < n; t_ball++) {
      let n_offset = t_ball * 128;
      if (ballState[n_offset + 24] & 4) {
        ballState[n_offset + 0] = ballState[n_offset + 6];
        ballState[n_offset + 1] = ballState[n_offset + 7];
        ballState[n_offset + 2] = ballState[n_offset + 8];
        ballState[n_offset + 3] = 0;
        ballState[n_offset + 4] = 0;
        ballState[n_offset + 5] = 0;
        continue;
      }
      let s_vx = ballState[n_offset + 3];
      let c_vy = ballState[n_offset + 4];
      let l_vz = ballState[n_offset + 5];
      let u_speedSq = s_vx * s_vx + c_vy * c_vy + l_vz * l_vz;
      if (u_speedSq > i_maxSpeedSq) {
        let e_scale = r_dt / Math.sqrt(u_speedSq);
        s_vx *= e_scale;
        c_vy *= e_scale;
        l_vz *= e_scale;
      }
      ballState[n_offset + 0] += s_vx;
      ballState[n_offset + 1] += c_vy;
      ballState[n_offset + 2] += l_vz;
      s_vx *= a_damping;
      c_vy *= a_damping;
      l_vz *= a_damping;
      if (Math.abs(s_vx) < 1e-4) s_vx = 0;
      if (Math.abs(c_vy) < 1e-4) c_vy = 0;
      if (Math.abs(l_vz) < 1e-4) l_vz = 0;
      ballState[n_offset + 3] = s_vx;
      ballState[n_offset + 4] = c_vy;
      ballState[n_offset + 5] = l_vz;
      if (
        s_vx !== 0 ||
        c_vy !== 0 ||
        l_vz !== 0 ||
        ballState[n_offset + 18] !== 0 ||
        ballState[n_offset + 19] !== 0 ||
        ballState[n_offset + 20] !== 0
      ) {
        o_moved = true;
      }
    }
    return o_moved;
  }

  _solveCollisionsOnce(
    ballState: Float32Array,
    input: Float32Array,
    n: number
  ) {
    let r_grid = this._grid;
    r_grid.clear();
    for (let t_ball = 0; t_ball < n; t_ball++) {
      if (!(ballState[t_ball * 128 + 24] & 5)) {
        r_grid.insert(ballState, t_ball);
      }
    }
    let i_pairs = r_grid.getPotentialPairs(ballState);
    let a_pairsCount = r_grid._pairsCount;
    let o_margin = input[19];
    let s_push = input[18];
    let c_restitution = input[7];
    let l_limit = input[21];
    let u_iters = input[20] | 0;
    let d_maxPen = 0;
    this._cachePanelCollisions(ballState, input, n);
    let f_pairsRatio = a_pairsCount / 2;
    if (f_pairsRatio > input[24]) {
      input[24] = f_pairsRatio;
    }
    let p_panelRatio = this._activePanelPairsCount / 3;
    if (p_panelRatio > input[27]) {
      input[27] = p_panelRatio;
    }
    if (a_pairsCount === 0 && this._activePanelPairsCount === 0) return 0;
    let m_iter = 0;
    for (; m_iter < u_iters; m_iter++) {
      let n_pen = 0;
      for (let t_idx = 0; t_idx < a_pairsCount; t_idx += 2) {
        let r_offset = i_pairs[t_idx] * 128;
        let a_offset = i_pairs[t_idx + 1] * 128;
        let l_dx = ballState[a_offset + 0] - ballState[r_offset + 0];
        let u_dy = ballState[a_offset + 1] - ballState[r_offset + 1];
        let d_dz = ballState[a_offset + 2] - ballState[r_offset + 2];
        let f_distSq = l_dx * l_dx + u_dy * u_dy + d_dz * d_dz;
        if (f_distSq === 0) continue;
        let p_sumRadius =
          ballState[r_offset + 9] + ballState[a_offset + 9] + o_margin;
        if (f_distSq >= p_sumRadius * p_sumRadius) continue;
        let m_dist = Math.sqrt(f_distSq) || 0.001;
        let h_pen = p_sumRadius - m_dist;
        if (h_pen > n_pen) n_pen = h_pen;
        let g_inv = 1 / m_dist;
        let _nx = l_dx * g_inv;
        let _ny = u_dy * g_inv;
        let _nz = d_dz * g_inv;
        let b_invM1 = ballState[r_offset + 10];
        let x_invM2 = ballState[a_offset + 10];
        let S_sumM = 1 / (b_invM1 + x_invM2);
        let C_ratio1 = b_invM1 * S_sumM;
        let w_ratio2 = x_invM2 * S_sumM;
        let T_push = h_pen * s_push;
        ballState[r_offset + 0] -= _nx * T_push * C_ratio1;
        ballState[r_offset + 1] -= _ny * T_push * C_ratio1;
        ballState[r_offset + 2] -= _nz * T_push * C_ratio1;
        ballState[a_offset + 0] += _nx * T_push * w_ratio2;
        ballState[a_offset + 1] += _ny * T_push * w_ratio2;
        ballState[a_offset + 2] += _nz * T_push * w_ratio2;
        let E_relV =
          (ballState[r_offset + 3] - ballState[a_offset + 3]) * _nx +
          (ballState[r_offset + 4] - ballState[a_offset + 4]) * _ny +
          (ballState[r_offset + 5] - ballState[a_offset + 5]) * _nz;
        if (E_relV > 0) {
          let t_imp = E_relV * c_restitution;
          ballState[r_offset + 3] -= _nx * t_imp * C_ratio1;
          ballState[r_offset + 4] -= _ny * t_imp * C_ratio1;
          ballState[r_offset + 5] -= _nz * t_imp * C_ratio1;
          ballState[a_offset + 3] += _nx * t_imp * w_ratio2;
          ballState[a_offset + 4] += _ny * t_imp * w_ratio2;
          ballState[a_offset + 5] += _nz * t_imp * w_ratio2;
        }
      }
      this._solvePanelCollisions(ballState, input, s_push);
      if (n_pen > d_maxPen) d_maxPen = n_pen;
      if (n_pen < l_limit) break;
    }
    let h_iters = m_iter < u_iters ? m_iter + 1 : u_iters;
    if (h_iters > input[23]) input[23] = h_iters;
    if (d_maxPen > input[25]) input[25] = d_maxPen;
    return d_maxPen;
  }

  _cachePanelCollisions(
    ballState: Float32Array,
    input: Float32Array,
    n: number
  ) {
    let r_panels = input[170] | 0;
    this._activePanelPairsCount = 0;
    if (r_panels === 0) return;
    let i_arr = this._activePanelPairs;
    let a_count = 0;
    let o_idx = 171;
    for (let s_panel = 0; s_panel < r_panels; s_panel++) {
      let r_px = input[o_idx];
      let s_py = input[o_idx + 1];
      let c_pz = input[o_idx + 2];
      let l_prad = input[o_idx + 3];
      let u_active = input[o_idx + 4];
      let m_pts = input[o_idx + 8] | 0;
      let h_idx = o_idx + 9;
      if (!u_active) {
        o_idx = h_idx + m_pts * 4;
        continue;
      }
      for (let u_ball = 0; u_ball < n; u_ball++) {
        let n_offset = u_ball * 128;
        if (ballState[n_offset + 24] & 5) continue;
        let d_dx = ballState[n_offset + 0] - r_px;
        let f_dy = ballState[n_offset + 1] - s_py;
        let p_dz = ballState[n_offset + 2] - c_pz;
        let g_limit = l_prad + ballState[n_offset + 9];
        if (!(d_dx * d_dx + f_dy * f_dy + p_dz * p_dz > g_limit * g_limit)) {
          for (let r_pt = 0; r_pt < m_pts; r_pt++) {
            let s_ptIdx = h_idx + r_pt * 4;
            let c_ptx = input[s_ptIdx];
            let l_pty = input[s_ptIdx + 1];
            let d_ptz = input[s_ptIdx + 2];
            let f_ptrad = input[s_ptIdx + 3];
            let p_dx = ballState[n_offset + 0] - c_ptx;
            let m_dy = ballState[n_offset + 1] - l_pty;
            let g_dz = ballState[n_offset + 2] - d_ptz;
            let _distSq = p_dx * p_dx + m_dy * m_dy + g_dz * g_dz;
            let v_minD = ballState[n_offset + 9] + f_ptrad + 0.15;
            if (_distSq < v_minD * v_minD && a_count + 3 < i_arr.length) {
              i_arr[a_count++] = u_ball;
              i_arr[a_count++] = s_ptIdx;
              i_arr[a_count++] = o_idx;
            }
          }
        }
      }
      o_idx = h_idx + m_pts * 4;
    }
    this._activePanelPairsCount = a_count;
  }

  _solvePanelCollisions(ballState: Float32Array, input: Float32Array, n: number) {
    let r_pairs = this._activePanelPairs;
    let i_count = this._activePanelPairsCount;
    for (let a = 0; a < i_count; a += 3) {
      let i_ball = r_pairs[a];
      let o_pt = r_pairs[a + 1];
      let s_panel = r_pairs[a + 2];
      let c_offset = i_ball * 128;
      let l_x = input[o_pt];
      let u_y = input[o_pt + 1];
      let d_z = input[o_pt + 2];
      let f_rad = input[o_pt + 3];
      let p_dx = ballState[c_offset + 0] - l_x;
      let m_dy = ballState[c_offset + 1] - u_y;
      let h_dz = ballState[c_offset + 2] - d_z;
      let g_distSq = p_dx * p_dx + m_dy * m_dy + h_dz * h_dz;
      let _sumR = ballState[c_offset + 9] + f_rad;
      if (g_distSq >= _sumR * _sumR) continue;
      let v_dist = Math.sqrt(g_distSq) || 0.001;
      let y_pen = _sumR - v_dist;
      let b_nx = p_dx / v_dist;
      let x_ny = m_dy / v_dist;
      let S_nz = h_dz / v_dist;
      let C_px = input[s_panel];
      let w_py = input[s_panel + 1];
      let T_pz = input[s_panel + 2];
      let E_val = input[s_panel + 5];
      let D_val = input[s_panel + 6];
      let O_val = input[s_panel + 7];
      let k_limit = (E_val - 1) * D_val * 0.5 + O_val;
      let A_distSq =
        (ballState[c_offset + 0] - C_px) * (ballState[c_offset + 0] - C_px) +
        (ballState[c_offset + 2] - T_pz) * (ballState[c_offset + 2] - T_pz);
      let j_limitRadius = k_limit + ballState[c_offset + 9];
      if (A_distSq < j_limitRadius * j_limitRadius) {
        let t_dir = ballState[c_offset + 1] > w_py ? 1 : -1;
        let n_slide = 0.85;
        x_ny = x_ny * (1 - n_slide) + t_dir * n_slide;
        b_nx *= 1 - n_slide;
        S_nz *= 1 - n_slide;
        let r_norm = Math.sqrt(b_nx * b_nx + x_ny * x_ny + S_nz * S_nz) || 1;
        b_nx /= r_norm;
        x_ny /= r_norm;
        S_nz /= r_norm;
      }
      let M_push = y_pen * n * 0.95;
      ballState[c_offset + 0] += b_nx * M_push;
      ballState[c_offset + 1] += x_ny * M_push;
      ballState[c_offset + 2] += S_nz * M_push;
      let N_relV =
        ballState[c_offset + 3] * b_nx +
        ballState[c_offset + 4] * x_ny +
        ballState[c_offset + 5] * S_nz;
      if (N_relV < 0) {
        ballState[c_offset + 3] -= b_nx * N_relV * 1.3 * 0.95;
        ballState[c_offset + 4] -= x_ny * N_relV * 1.3 * 0.95;
        ballState[c_offset + 5] -= S_nz * N_relV * 1.3 * 0.95;
      }
    }
  }

  _adjustTargetsForColliders(
    ballState: Float32Array,
    input: Float32Array,
    n: number
  ) {
    let r_colliders = input[32] | 0;
    if (r_colliders !== 0) {
      for (let i_ball = 0; i_ball < n; i_ball++) {
        let n_offset = i_ball * 128;
        if (ballState[n_offset + 24] & 5) continue;
        let a_offset = this._getMergedColliderOffsetY(
          ballState[n_offset + 6],
          ballState[n_offset + 7],
          ballState[n_offset + 8],
          ballState[n_offset + 9],
          input,
          r_colliders
        );
        ballState[n_offset + 114] = a_offset === null ? 0 : 1;
        if (a_offset !== null) {
          ballState[n_offset + 112] = a_offset;
          ballState[n_offset + 7] += a_offset;
        }
      }
    }
  }

  _restoreTargets(ballState: Float32Array, t: number) {
    for (let n = 0; n < t; n++) {
      let t_offset = n * 128;
      let r = ballState[t_offset + 112];
      if (r !== 0) {
        ballState[t_offset + 7] -= r;
        ballState[t_offset + 112] = 0;
      }
    }
  }

  _getMergedColliderOffsetY(
    e_tx: number,
    t_ty: number,
    n_tz: number,
    r_rad: number,
    i_arr: Float32Array,
    a_count: number
  ) {
    let o_affecting = this._affecting;
    let s_count = 0;
    for (let c_idx = 0; c_idx < a_count; c_idx++) {
      let a_offset = 33 + c_idx * 8;
      if (!i_arr[a_offset + 6]) continue;
      let l_hx = i_arr[a_offset + 3] + r_rad;
      let u_hy = i_arr[a_offset + 4] + r_rad;
      let d_hz = i_arr[a_offset + 5] + r_rad;
      if (
        Math.abs(e_tx - i_arr[a_offset]) <= l_hx &&
        Math.abs(t_ty - i_arr[a_offset + 1]) <= u_hy &&
        Math.abs(n_tz - i_arr[a_offset + 2]) <= d_hz
      ) {
        o_affecting[s_count++] = a_offset;
      }
    }
    if (s_count === 0) return null;
    if (s_count === 1) {
      let a_offset = o_affecting[0];
      let s_hy = i_arr[a_offset + 4] + r_rad;
      let c_dy = t_ty - i_arr[a_offset + 1];
      let l_dir = i_arr[a_offset + 7] || c_dy >= 0 ? 1 : -1;
      let u_offset = i_arr[a_offset + 1] + l_dir * s_hy - t_ty;
      let d_dx = Math.abs(e_tx - i_arr[a_offset]);
      let f_dz = Math.abs(n_tz - i_arr[a_offset + 2]);
      let p_ratioX =
        d_dx > i_arr[a_offset + 3]
          ? 1 - (d_dx - i_arr[a_offset + 3]) / r_rad
          : 1;
      let m_ratioZ =
        f_dz > i_arr[a_offset + 5]
          ? 1 - (f_dz - i_arr[a_offset + 5]) / r_rad
          : 1;
      return u_offset * Math.max(0, p_ratioX) * Math.max(0, m_ratioZ);
    }
    let c_min = 1 / 0;
    let l_max = -1 / 0;
    let u_lead = o_affecting[0];
    let d_flip = 0;
    for (let e_idx = 0; e_idx < s_count; e_idx++) {
      let t_offset = o_affecting[e_idx];
      let n_hy = i_arr[t_offset + 4] + r_rad;
      let a_low = i_arr[t_offset + 1] - n_hy;
      let s_high = i_arr[t_offset + 1] + n_hy;
      if (a_low < c_min) c_min = a_low;
      if (s_high > l_max) l_max = s_high;
      if (i_arr[t_offset + 3] > i_arr[u_lead + 3]) u_lead = t_offset;
      if (i_arr[t_offset + 7]) d_flip = 1;
    }
    let f_topDist = l_max - t_ty;
    let p_botDist = t_ty - c_min;
    let m_offset = d_flip || f_topDist < p_botDist ? f_topDist : -p_botDist;
    let h_dx = Math.abs(e_tx - i_arr[u_lead]);
    let g_dz = Math.abs(n_tz - i_arr[u_lead + 2]);
    let _ratioX =
      h_dx > i_arr[u_lead + 3] ? 1 - (h_dx - i_arr[u_lead + 3]) / r_rad : 1;
    let v_ratioZ =
      g_dz > i_arr[u_lead + 5] ? 1 - (g_dz - i_arr[u_lead + 5]) / r_rad : 1;
    return m_offset * Math.max(0, _ratioX) * Math.max(0, v_ratioZ);
  }

  _correctPositionsForColliders(
    ballState: Float32Array,
    input: Float32Array,
    n: number
  ) {
    let r_colliders = input[32] | 0;
    if (r_colliders !== 0) {
      for (let i_ball = 0; i_ball < n; i_ball++) {
        let n_offset = i_ball * 128;
        if (ballState[n_offset + 24] & 5 || !ballState[n_offset + 114])
          continue;
        let a_offset = this._getMergedColliderOffsetY(
          ballState[n_offset + 0],
          ballState[n_offset + 1],
          ballState[n_offset + 2],
          ballState[n_offset + 9],
          input,
          r_colliders
        );
        if (a_offset !== null) {
          ballState[n_offset + 1] += a_offset;
          if (
            (a_offset > 0 && ballState[n_offset + 4] < 0) ||
            (a_offset < 0 && ballState[n_offset + 4] > 0)
          ) {
            ballState[n_offset + 4] *= 0.3;
          }
        }
      }
    }
  }

  _clampMinY(ballState: Float32Array, t: number) {
    for (let n = 0; n < t; n++) {
      let t_offset = n * 128;
      let r = ballState[t_offset + 21];
      if (!isNaN(r) && ballState[t_offset + 1] < r) {
        ballState[t_offset + 1] = r;
        if (ballState[t_offset + 4] < 0) {
          ballState[t_offset + 4] = 0;
        }
      }
    }
  }

  _updateSoftBodies(
    ballState: Float32Array,
    input: Float32Array,
    n: number
  ) {
    let r_gravity = input[12];
    for (let t_ball = 0; t_ball < n; t_ball++) {
      let n_offset = t_ball * 128;
      if (ballState[n_offset + 24] & 4) {
        ballState[n_offset + 12] = ballState[n_offset + 0];
        ballState[n_offset + 13] = ballState[n_offset + 1];
        ballState[n_offset + 14] = ballState[n_offset + 2];
        ballState[n_offset + 15] = 0;
        ballState[n_offset + 16] = 0;
        ballState[n_offset + 17] = 0;
        ballState[n_offset + 18] = 0;
        ballState[n_offset + 19] = 0;
        ballState[n_offset + 20] = 0;
        continue;
      }
      let i_dx = ballState[n_offset + 0] - ballState[n_offset + 12];
      let a_dy = ballState[n_offset + 1] - ballState[n_offset + 13];
      let o_dz = ballState[n_offset + 2] - ballState[n_offset + 14];
      let s_stiff = ballState[n_offset + 22];
      let c_damp = ballState[n_offset + 23];
      let l_vx = ballState[n_offset + 18];
      let u_vy = ballState[n_offset + 19];
      let d_vz = ballState[n_offset + 20];
      l_vx += (i_dx - ballState[n_offset + 15]) * s_stiff;
      u_vy += (a_dy - ballState[n_offset + 16]) * s_stiff + r_gravity;
      d_vz += (o_dz - ballState[n_offset + 17]) * s_stiff;
      l_vx *= c_damp;
      u_vy *= c_damp;
      d_vz *= c_damp;
      ballState[n_offset + 15] += l_vx;
      ballState[n_offset + 16] += u_vy;
      ballState[n_offset + 17] += d_vz;
      ballState[n_offset + 18] = l_vx;
      ballState[n_offset + 19] = u_vy;
      ballState[n_offset + 20] = d_vz;
      ballState[n_offset + 12] = ballState[n_offset + 0];
      ballState[n_offset + 13] = ballState[n_offset + 1];
      ballState[n_offset + 14] = ballState[n_offset + 2];
    }
  }

  _computeMatrices(
    ballState: Float32Array,
    input: Float32Array,
    n: number
  ) {
    let d_time = input[13];
    let f_boundsYCenter = input[14];
    let p_boundsYHalf = input[15];
    let v_boundsXCenter = input[28];
    let y_boundsXHalf = input[29];
    let b_offset = input[22] || 2;
    let x_ymin = f_boundsYCenter - p_boundsYHalf - b_offset;
    let S_ymax = f_boundsYCenter + p_boundsYHalf + b_offset;
    let C_xCheck = y_boundsXHalf > 0;
    let w_xmin = v_boundsXCenter - y_boundsXHalf - b_offset;
    let T_xmax = v_boundsXCenter + y_boundsXHalf + b_offset;
    for (let l_idx = 0; l_idx < n; l_idx++) {
      let u_idx = l_idx * 128;
      let f_y = ballState[u_idx + 1];
      let p_x = ballState[u_idx + 0];
      if (
        f_y < x_ymin ||
        f_y > S_ymax ||
        (C_xCheck && (p_x < w_xmin || p_x > T_xmax))
      ) {
        ballState[u_idx + 26] = 0;
        ballState[u_idx + 113] = 0;
        let e_idx = u_idx + 48;
        for (let t_idx = 0; t_idx < 16; t_idx++) {
          ballState[e_idx + t_idx] = 0;
        }
        continue;
      }
      ballState[u_idx + 113] = 1;
      let v_matIdx = u_idx + 48;
      let y_dx = ballState[u_idx + 15];
      let b_dy = ballState[u_idx + 16];
      let E_dz = ballState[u_idx + 17];
      let D_dist = Math.sqrt(y_dx * y_dx + b_dy * b_dy + E_dz * E_dz);
      let O_rad = ballState[u_idx + 9];
      let k_defActive = +(D_dist > 0.001);
      let A_factor = ballState[u_idx + 36];
      A_factor += (k_defActive - A_factor) * 0.1;
      ballState[u_idx + 36] = A_factor;
      let j_jitter = ballState[u_idx + 37];
      if (D_dist < 8e-4) {
        j_jitter += (1 - j_jitter) * 0.05;
      } else if (D_dist > 0.002) {
        j_jitter *= 0.9;
      }
      ballState[u_idx + 37] = j_jitter;
      let M_scaleMult =
        j_jitter > 0.01
          ? 1 +
            Math.sin(
              d_time * ballState[u_idx + 40] + ballState[u_idx + 41]
            ) *
              ballState[u_idx + 39] *
              j_jitter
          : 1;
      ballState[u_idx + 43] = M_scaleMult;
      let N_targetActive = ballState[u_idx + 26];
      let P_qx = ballState[u_idx + 32];
      let F_qy = ballState[u_idx + 33];
      let I_qz = ballState[u_idx + 34];
      let L_qw = ballState[u_idx + 35];
      let R_rotActive = false;
      if (N_targetActive) {
        let s_tx = ballState[u_idx + 27] - ballState[u_idx + 0];
        let l_ty = ballState[u_idx + 28] - ballState[u_idx + 1];
        let d_tz = ballState[u_idx + 29] - ballState[u_idx + 2];
        let f_distSq = s_tx * s_tx + l_ty * l_ty + d_tz * d_tz;
        if (f_distSq > 1e-4) {
          let p_invDist = 1 / Math.sqrt(f_distSq);
          s_tx *= p_invDist;
          l_ty *= p_invDist;
          d_tz *= p_invDist;
          o(0, 0, 1, s_tx, l_ty, d_tz);
          let m_dot = Math.abs(i(0, 0, 0, 1, e, t, n, r));
          let h_angle = 2 * Math.acos(Math.min(m_dot, 1));
          let g_limit = ballState[u_idx + 31];
          if (h_angle > g_limit) {
            let i_ratio = g_limit / h_angle;
            c(e, t, n, r, 0, 0, 0, 1, 1 - i_ratio);
          }
          if (i(P_qx, F_qy, I_qz, L_qw, e, t, n, r) < 0.9999) {
            let i_slerp = ballState[u_idx + 30];
            c(P_qx, F_qy, I_qz, L_qw, e, t, n, r, i_slerp);
            P_qx = e;
            F_qy = t;
            I_qz = n;
            L_qw = r;
          }
        }
      } else {
        let o_dot = i(P_qx, F_qy, I_qz, L_qw, 0, 0, 0, 1);
        if (Math.abs(o_dot) < 0.9999) {
          let i_slerp = ballState[u_idx + 30] || 0.12;
          c(P_qx, F_qy, I_qz, L_qw, 0, 0, 0, 1, i_slerp);
          P_qx = e;
          F_qy = t;
          I_qz = n;
          L_qw = r;
        }
      }
      ballState[u_idx + 32] = P_qx;
      ballState[u_idx + 33] = F_qy;
      ballState[u_idx + 34] = I_qz;
      ballState[u_idx + 35] = L_qw;
      R_rotActive = Math.abs(i(P_qx, F_qy, I_qz, L_qw, 0, 0, 0, 1)) < 0.9999;
      let z_defMult = ballState[u_idx + 38];
      if (A_factor > 0.01 && z_defMult > 0 && D_dist > 1e-4) {
        let e_scale = 1 + Math.min(D_dist / 0.15, 1) * z_defMult * A_factor;
        let t_inv = 1 / Math.sqrt(e_scale);
        let n_dx = y_dx / D_dist;
        let r_dy = b_dy / D_dist;
        let i_dz = E_dz / D_dist;
        let o_sz = O_rad * M_scaleMult;
        let s_sz_t = o_sz * t_inv;
        let c_sz_e = o_sz * (e_scale - t_inv);
        ballState[v_matIdx] = s_sz_t + c_sz_e * n_dx * n_dx;
        ballState[v_matIdx + 1] = c_sz_e * n_dx * r_dy;
        ballState[v_matIdx + 2] = c_sz_e * n_dx * i_dz;
        ballState[v_matIdx + 3] = 0;
        ballState[v_matIdx + 4] = c_sz_e * r_dy * n_dx;
        ballState[v_matIdx + 5] = s_sz_t + c_sz_e * r_dy * r_dy;
        ballState[v_matIdx + 6] = c_sz_e * r_dy * i_dz;
        ballState[v_matIdx + 7] = 0;
        ballState[v_matIdx + 8] = c_sz_e * i_dz * n_dx;
        ballState[v_matIdx + 9] = c_sz_e * i_dz * r_dy;
        ballState[v_matIdx + 10] = s_sz_t + c_sz_e * i_dz * i_dz;
        ballState[v_matIdx + 11] = 0;
        ballState[v_matIdx + 12] = 0;
        ballState[v_matIdx + 13] = 0;
        ballState[v_matIdx + 14] = 0;
        ballState[v_matIdx + 15] = 1;
        if (R_rotActive) {
          m(_, 0, P_qx, F_qy, I_qz, L_qw);
          h(ballState, v_matIdx, _);
        }
      } else {
        let e_scale = O_rad * M_scaleMult;
        if (R_rotActive) {
          m(ballState, v_matIdx, P_qx, F_qy, I_qz, L_qw);
          ballState[v_matIdx] *= e_scale;
          ballState[v_matIdx + 1] *= e_scale;
          ballState[v_matIdx + 2] *= e_scale;
          ballState[v_matIdx + 4] *= e_scale;
          ballState[v_matIdx + 5] *= e_scale;
          ballState[v_matIdx + 6] *= e_scale;
          ballState[v_matIdx + 8] *= e_scale;
          ballState[v_matIdx + 9] *= e_scale;
          ballState[v_matIdx + 10] *= e_scale;
        } else {
          ballState[v_matIdx] = e_scale;
          ballState[v_matIdx + 1] = 0;
          ballState[v_matIdx + 2] = 0;
          ballState[v_matIdx + 3] = 0;
          ballState[v_matIdx + 4] = 0;
          ballState[v_matIdx + 5] = e_scale;
          ballState[v_matIdx + 6] = 0;
          ballState[v_matIdx + 7] = 0;
          ballState[v_matIdx + 8] = 0;
          ballState[v_matIdx + 9] = 0;
          ballState[v_matIdx + 10] = e_scale;
          ballState[v_matIdx + 11] = 0;
          ballState[v_matIdx + 12] = 0;
          ballState[v_matIdx + 13] = 0;
          ballState[v_matIdx + 14] = 0;
          ballState[v_matIdx + 15] = 1;
        }
      }
      let B_yaw = ballState[u_idx + 44];
      if (B_yaw !== 0) {
        s(0, 1, 0, -B_yaw);
        m(_, 0, e, t, n, r);
        g(ballState, v_matIdx, _);
      }
      let V_roll = ballState[u_idx + 42];
      if (V_roll !== 0) {
        s(0, 1, 0, V_roll);
        m(_, 0, e, t, n, r);
        h(ballState, v_matIdx, _);
      }
      ballState[v_matIdx + 12] = ballState[u_idx + 0] + ballState[u_idx + 45];
      ballState[v_matIdx + 13] = ballState[u_idx + 1] + ballState[u_idx + 46];
      ballState[v_matIdx + 14] = ballState[u_idx + 2] + ballState[u_idx + 47];
    }
  }

  _computeEyeSprings(ballState: Float32Array, n: number) {
    for (let t_ball = 0; t_ball < n; t_ball++) {
      let t_offset = t_ball * 128;
      if (!ballState[t_offset + 113]) continue;
      let r_targetActive = ballState[t_offset + 26];
      let i_qx = ballState[t_offset + 32];
      let a_qy = ballState[t_offset + 33];
      let o_qz = ballState[t_offset + 34];
      let s_qw = ballState[t_offset + 35];
      let c_yaw = ballState[t_offset + 44];
      for (let n_eye = 0; n_eye < 3; n_eye++) {
        let p_eyeIdx = t_offset + 64 + n_eye * 16;
        if (!ballState[p_eyeIdx + 0] || !ballState[p_eyeIdx + 14]) continue;
        let m_x = ballState[p_eyeIdx + 1]
          ? -ballState[p_eyeIdx + 8]
          : ballState[p_eyeIdx + 8];
        let h_y = ballState[p_eyeIdx + 9];
        let g_z = ballState[p_eyeIdx + 10];
        let _dist = Math.sqrt(m_x * m_x + h_y * h_y + g_z * g_z);
        if (_dist > 1e-4) {
          m_x /= _dist;
          h_y /= _dist;
          g_z /= _dist;
        }
        if (r_targetActive) {
          f(m_x, h_y, g_z, i_qx, a_qy, o_qz, s_qw);
          m_x = l;
          h_y = u;
          g_z = d;
        }
        if (c_yaw !== 0) {
          let e_cos = Math.cos(-c_yaw);
          let t_sin = Math.sin(-c_yaw);
          let n_x = m_x * e_cos + g_z * t_sin;
          let r_z = -m_x * t_sin + g_z * e_cos;
          m_x = n_x;
          g_z = r_z;
        }
        let v_x = ballState[p_eyeIdx + 11];
        let y_y = ballState[p_eyeIdx + 12];
        let b_x = ballState[p_eyeIdx + 5];
        let x_y = ballState[p_eyeIdx + 6];
        let S_z = ballState[p_eyeIdx + 7];
        let C_x = ballState[p_eyeIdx + 2];
        let w_y = ballState[p_eyeIdx + 3];
        let T_z = ballState[p_eyeIdx + 4];
        b_x += (m_x - C_x) * v_x;
        x_y += (h_y - w_y) * v_x;
        S_z += (g_z - T_z) * v_x;
        b_x *= y_y;
        x_y *= y_y;
        S_z *= y_y;
        C_x += b_x;
        w_y += x_y;
        T_z += S_z;
        let E_dist = Math.sqrt(C_x * C_x + w_y * w_y + T_z * T_z);
        if (E_dist > 1e-4) {
          C_x /= E_dist;
          w_y /= E_dist;
          T_z /= E_dist;
        }
        let D_limit = ballState[p_eyeIdx + 13];
        let O_dx = C_x - m_x;
        let k_dy = w_y - h_y;
        let A_dz = T_z - g_z;
        let j_dist = Math.sqrt(O_dx * O_dx + k_dy * k_dy + A_dz * A_dz);
        if (j_dist > D_limit && j_dist > 1e-4) {
          let e_ratio = D_limit / j_dist;
          C_x = m_x + O_dx * e_ratio;
          w_y = h_y + k_dy * e_ratio;
          T_z = g_z + A_dz * e_ratio;
          E_dist = Math.sqrt(C_x * C_x + w_y * w_y + T_z * T_z);
          if (E_dist > 1e-4) {
            C_x /= E_dist;
            w_y /= E_dist;
            T_z /= E_dist;
          }
          let t_dot = b_x * O_dx + x_y * k_dy + S_z * A_dz;
          if (t_dot > 0) {
            b_x -= (O_dx / j_dist) * t_dot * 0.8;
            x_y -= (k_dy / j_dist) * t_dot * 0.8;
            S_z -= (A_dz / j_dist) * t_dot * 0.8;
          }
        }
        ballState[p_eyeIdx + 2] = C_x;
        ballState[p_eyeIdx + 3] = w_y;
        ballState[p_eyeIdx + 4] = T_z;
        ballState[p_eyeIdx + 5] = b_x;
        ballState[p_eyeIdx + 6] = x_y;
        ballState[p_eyeIdx + 7] = S_z;
      }
    }
  }
}
