// A small neural network (one hidden ReLU layer, softmax output) for the guided lab (Experiment 10).
// Trained with backpropagation and Adam on mini-batches; every random choice is seeded. Pure functions, unit-tested.
import { seededRandom } from "./classifyMath.js";

export const ACTIVATIONS = {
  relu: (z) => Math.max(0, z),
  sigmoid: (z) => 1 / (1 + Math.exp(-z)),
  tanh: (z) => Math.tanh(z),
};

/** One neuron: activation(w1·x1 + w2·x2 + … + b). */
export function neuron(inputs, weights, bias, activation = "relu") {
  const z = inputs.reduce((s, x, i) => s + x * weights[i], bias);
  return { z, output: ACTIVATIONS[activation](z) };
}

/** Number of weights and biases: n·h + h for the hidden layer, h·k + k for the output layer. */
export function parameterCount(nIn, nHidden, nOut) {
  return nIn * nHidden + nHidden + nHidden * nOut + nOut;
}

function gaussian(rng) {
  const u = 1 - rng();
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** A new network with small random weights (He start for ReLU) and zero biases. */
export function createNetwork(nIn, nHidden, nOut, seed = 1) {
  const rng = seededRandom(seed);
  const w1 = new Float64Array(nHidden * nIn).map(
    () => gaussian(rng) * Math.sqrt(2 / nIn),
  );
  const w2 = new Float64Array(nOut * nHidden).map(
    () => gaussian(rng) * Math.sqrt(1 / nHidden),
  );
  const params = {
    w1,
    b1: new Float64Array(nHidden),
    w2,
    b2: new Float64Array(nOut),
  };
  const zeros = () =>
    Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, new Float64Array(v.length)]),
    );
  return {
    nIn,
    nHidden,
    nOut,
    params,
    adam: { m: zeros(), v: zeros(), t: 0 },
    rng,
  };
}

/** Forward pass for one example: hidden activations and softmax probabilities. */
export function forward(net, x) {
  const { nIn, nHidden, nOut, params } = net;
  const h = new Float64Array(nHidden);
  for (let j = 0; j < nHidden; j += 1) {
    let z = params.b1[j];
    for (let i = 0; i < nIn; i += 1) z += params.w1[j * nIn + i] * x[i];
    h[j] = z > 0 ? z : 0;
  }
  const scores = new Float64Array(nOut);
  let top = -Infinity;
  for (let k = 0; k < nOut; k += 1) {
    let z = params.b2[k];
    for (let j = 0; j < nHidden; j += 1) z += params.w2[k * nHidden + j] * h[j];
    scores[k] = z;
    top = Math.max(top, z);
  }
  let total = 0;
  const probs = scores.map((z) => {
    const e = Math.exp(z - top);
    total += e;
    return e;
  });
  for (let k = 0; k < nOut; k += 1) probs[k] /= total;
  return { h, probs };
}

export function predictClass(net, x) {
  const { probs } = forward(net, x);
  let best = 0;
  for (let k = 1; k < probs.length; k += 1)
    if (probs[k] > probs[best]) best = k;
  return best;
}

/**
 * One epoch: shuffle the training rows, then for each mini-batch do a forward pass, backpropagate the
 * cross-entropy loss and take an Adam step of size `learningRate`. Returns the mean loss over the epoch.
 */
export function trainEpoch(
  net,
  X,
  y,
  { learningRate = 0.01, batchSize = 32 } = {},
) {
  const { nIn, nHidden, nOut, params, adam, rng } = net;
  const order = Array.from({ length: X.length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const r = Math.floor(rng() * (i + 1));
    [order[i], order[r]] = [order[r], order[i]];
  }
  let lossSum = 0;
  for (let start = 0; start < order.length; start += batchSize) {
    const batch = order.slice(start, start + batchSize);
    const grads = Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, new Float64Array(v.length)]),
    );
    for (const idx of batch) {
      const x = X[idx];
      const { h, probs } = forward(net, x);
      lossSum += -Math.log(Math.max(probs[y[idx]], 1e-12));
      const dScores = Float64Array.from(probs);
      dScores[y[idx]] -= 1; // softmax + cross-entropy gradient
      const dH = new Float64Array(nHidden);
      for (let k = 0; k < nOut; k += 1) {
        grads.b2[k] += dScores[k];
        for (let j = 0; j < nHidden; j += 1) {
          grads.w2[k * nHidden + j] += dScores[k] * h[j];
          dH[j] += dScores[k] * params.w2[k * nHidden + j];
        }
      }
      for (let j = 0; j < nHidden; j += 1) {
        if (h[j] <= 0) continue; // ReLU passes the gradient only where it was active
        grads.b1[j] += dH[j];
        for (let i = 0; i < nIn; i += 1) grads.w1[j * nIn + i] += dH[j] * x[i];
      }
    }
    // Adam step on the batch-average gradient.
    adam.t += 1;
    const b1 = 0.9;
    const b2 = 0.999;
    const c1 = 1 - b1 ** adam.t;
    const c2 = 1 - b2 ** adam.t;
    for (const key of Object.keys(params)) {
      const p = params[key];
      const g = grads[key];
      const m = adam.m[key];
      const v = adam.v[key];
      for (let i = 0; i < p.length; i += 1) {
        const gi = g[i] / batch.length;
        m[i] = b1 * m[i] + (1 - b1) * gi;
        v[i] = b2 * v[i] + (1 - b2) * gi * gi;
        p[i] -= (learningRate * (m[i] / c1)) / (Math.sqrt(v[i] / c2) + 1e-8);
      }
    }
  }
  return lossSum / X.length;
}

export function accuracyOf(net, X, y) {
  let right = 0;
  for (let i = 0; i < X.length; i += 1)
    if (predictClass(net, X[i]) === y[i]) right += 1;
  return right / X.length;
}
