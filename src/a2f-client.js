// node_modules/@protobuf-ts/runtime/build/es2015/json-typings.js
function typeofJsonValue(value) {
  let t = typeof value;
  if (t == "object") {
    if (Array.isArray(value))
      return "array";
    if (value === null)
      return "null";
  }
  return t;
}
function isJsonObject(value) {
  return value !== null && typeof value == "object" && !Array.isArray(value);
}

// node_modules/@protobuf-ts/runtime/build/es2015/base64.js
var encTable = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
var decTable = [];
for (let i = 0; i < encTable.length; i++)
  decTable[encTable[i].charCodeAt(0)] = i;
decTable["-".charCodeAt(0)] = encTable.indexOf("+");
decTable["_".charCodeAt(0)] = encTable.indexOf("/");
function base64decode(base64Str) {
  let es = base64Str.length * 3 / 4;
  if (base64Str[base64Str.length - 2] == "=")
    es -= 2;
  else if (base64Str[base64Str.length - 1] == "=")
    es -= 1;
  let bytes = new Uint8Array(es), bytePos = 0, groupPos = 0, b, p = 0;
  for (let i = 0; i < base64Str.length; i++) {
    b = decTable[base64Str.charCodeAt(i)];
    if (b === void 0) {
      switch (base64Str[i]) {
        case "=":
          groupPos = 0;
        // reset state when padding found
        case "\n":
        case "\r":
        case "	":
        case " ":
          continue;
        // skip white-space, and padding
        default:
          throw Error(`invalid base64 string.`);
      }
    }
    switch (groupPos) {
      case 0:
        p = b;
        groupPos = 1;
        break;
      case 1:
        bytes[bytePos++] = p << 2 | (b & 48) >> 4;
        p = b;
        groupPos = 2;
        break;
      case 2:
        bytes[bytePos++] = (p & 15) << 4 | (b & 60) >> 2;
        p = b;
        groupPos = 3;
        break;
      case 3:
        bytes[bytePos++] = (p & 3) << 6 | b;
        groupPos = 0;
        break;
    }
  }
  if (groupPos == 1)
    throw Error(`invalid base64 string.`);
  return bytes.subarray(0, bytePos);
}
function base64encode(bytes) {
  let base64 = "", groupPos = 0, b, p = 0;
  for (let i = 0; i < bytes.length; i++) {
    b = bytes[i];
    switch (groupPos) {
      case 0:
        base64 += encTable[b >> 2];
        p = (b & 3) << 4;
        groupPos = 1;
        break;
      case 1:
        base64 += encTable[p | b >> 4];
        p = (b & 15) << 2;
        groupPos = 2;
        break;
      case 2:
        base64 += encTable[p | b >> 6];
        base64 += encTable[b & 63];
        groupPos = 0;
        break;
    }
  }
  if (groupPos) {
    base64 += encTable[p];
    base64 += "=";
    if (groupPos == 1)
      base64 += "=";
  }
  return base64;
}

// node_modules/@protobuf-ts/runtime/build/es2015/binary-format-contract.js
var UnknownFieldHandler;
(function(UnknownFieldHandler2) {
  UnknownFieldHandler2.symbol = /* @__PURE__ */ Symbol.for("protobuf-ts/unknown");
  UnknownFieldHandler2.onRead = (typeName, message, fieldNo, wireType, data) => {
    let container = is(message) ? message[UnknownFieldHandler2.symbol] : message[UnknownFieldHandler2.symbol] = [];
    container.push({ no: fieldNo, wireType, data });
  };
  UnknownFieldHandler2.onWrite = (typeName, message, writer) => {
    for (let { no, wireType, data } of UnknownFieldHandler2.list(message))
      writer.tag(no, wireType).raw(data);
  };
  UnknownFieldHandler2.list = (message, fieldNo) => {
    if (is(message)) {
      let all = message[UnknownFieldHandler2.symbol];
      return fieldNo ? all.filter((uf) => uf.no == fieldNo) : all;
    }
    return [];
  };
  UnknownFieldHandler2.last = (message, fieldNo) => UnknownFieldHandler2.list(message, fieldNo).slice(-1)[0];
  const is = (message) => message && Array.isArray(message[UnknownFieldHandler2.symbol]);
})(UnknownFieldHandler || (UnknownFieldHandler = {}));
function mergeBinaryOptions(a, b) {
  return Object.assign(Object.assign({}, a), b);
}
var WireType;
(function(WireType2) {
  WireType2[WireType2["Varint"] = 0] = "Varint";
  WireType2[WireType2["Bit64"] = 1] = "Bit64";
  WireType2[WireType2["LengthDelimited"] = 2] = "LengthDelimited";
  WireType2[WireType2["StartGroup"] = 3] = "StartGroup";
  WireType2[WireType2["EndGroup"] = 4] = "EndGroup";
  WireType2[WireType2["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));

// node_modules/@protobuf-ts/runtime/build/es2015/goog-varint.js
function varint64read() {
  let lowBits = 0;
  let highBits = 0;
  for (let shift = 0; shift < 28; shift += 7) {
    let b = this.buf[this.pos++];
    lowBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  let middleByte = this.buf[this.pos++];
  lowBits |= (middleByte & 15) << 28;
  highBits = (middleByte & 112) >> 4;
  if ((middleByte & 128) == 0) {
    this.assertBounds();
    return [lowBits, highBits];
  }
  for (let shift = 3; shift <= 31; shift += 7) {
    let b = this.buf[this.pos++];
    highBits |= (b & 127) << shift;
    if ((b & 128) == 0) {
      this.assertBounds();
      return [lowBits, highBits];
    }
  }
  throw new Error("invalid varint");
}
function varint64write(lo, hi, bytes) {
  for (let i = 0; i < 28; i = i + 7) {
    const shift = lo >>> i;
    const hasNext = !(shift >>> 7 == 0 && hi == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
  const hasMoreBits = !(hi >> 3 == 0);
  bytes.push((hasMoreBits ? splitBits | 128 : splitBits) & 255);
  if (!hasMoreBits) {
    return;
  }
  for (let i = 3; i < 31; i = i + 7) {
    const shift = hi >>> i;
    const hasNext = !(shift >>> 7 == 0);
    const byte = (hasNext ? shift | 128 : shift) & 255;
    bytes.push(byte);
    if (!hasNext) {
      return;
    }
  }
  bytes.push(hi >>> 31 & 1);
}
var TWO_PWR_32_DBL = (1 << 16) * (1 << 16);
function int64fromString(dec) {
  let minus = dec[0] == "-";
  if (minus)
    dec = dec.slice(1);
  const base = 1e6;
  let lowBits = 0;
  let highBits = 0;
  function add1e6digit(begin, end) {
    const digit1e6 = Number(dec.slice(begin, end));
    highBits *= base;
    lowBits = lowBits * base + digit1e6;
    if (lowBits >= TWO_PWR_32_DBL) {
      highBits = highBits + (lowBits / TWO_PWR_32_DBL | 0);
      lowBits = lowBits % TWO_PWR_32_DBL;
    }
  }
  add1e6digit(-24, -18);
  add1e6digit(-18, -12);
  add1e6digit(-12, -6);
  add1e6digit(-6);
  return [minus, lowBits, highBits];
}
function int64toString(bitsLow, bitsHigh) {
  if (bitsHigh >>> 0 <= 2097151) {
    return "" + (TWO_PWR_32_DBL * bitsHigh + (bitsLow >>> 0));
  }
  let low = bitsLow & 16777215;
  let mid = (bitsLow >>> 24 | bitsHigh << 8) >>> 0 & 16777215;
  let high = bitsHigh >> 16 & 65535;
  let digitA = low + mid * 6777216 + high * 6710656;
  let digitB = mid + high * 8147497;
  let digitC = high * 2;
  let base = 1e7;
  if (digitA >= base) {
    digitB += Math.floor(digitA / base);
    digitA %= base;
  }
  if (digitB >= base) {
    digitC += Math.floor(digitB / base);
    digitB %= base;
  }
  function decimalFrom1e7(digit1e7, needLeadingZeros) {
    let partial = digit1e7 ? String(digit1e7) : "";
    if (needLeadingZeros) {
      return "0000000".slice(partial.length) + partial;
    }
    return partial;
  }
  return decimalFrom1e7(
    digitC,
    /*needLeadingZeros=*/
    0
  ) + decimalFrom1e7(
    digitB,
    /*needLeadingZeros=*/
    digitC
  ) + // If the final 1e7 digit didn't need leading zeros, we would have
  // returned via the trivial code path at the top.
  decimalFrom1e7(
    digitA,
    /*needLeadingZeros=*/
    1
  );
}
function varint32write(value, bytes) {
  if (value >= 0) {
    while (value > 127) {
      bytes.push(value & 127 | 128);
      value = value >>> 7;
    }
    bytes.push(value);
  } else {
    for (let i = 0; i < 9; i++) {
      bytes.push(value & 127 | 128);
      value = value >> 7;
    }
    bytes.push(1);
  }
}
function varint32read() {
  let b = this.buf[this.pos++];
  let result = b & 127;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 7;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 14;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 127) << 21;
  if ((b & 128) == 0) {
    this.assertBounds();
    return result;
  }
  b = this.buf[this.pos++];
  result |= (b & 15) << 28;
  for (let readBytes = 5; (b & 128) !== 0 && readBytes < 10; readBytes++)
    b = this.buf[this.pos++];
  if ((b & 128) != 0)
    throw new Error("invalid varint");
  this.assertBounds();
  return result >>> 0;
}

// node_modules/@protobuf-ts/runtime/build/es2015/pb-long.js
var BI;
function detectBi() {
  const dv = new DataView(new ArrayBuffer(8));
  const ok = globalThis.BigInt !== void 0 && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function";
  BI = ok ? {
    MIN: BigInt("-9223372036854775808"),
    MAX: BigInt("9223372036854775807"),
    UMIN: BigInt("0"),
    UMAX: BigInt("18446744073709551615"),
    C: BigInt,
    V: dv
  } : void 0;
}
detectBi();
function assertBi(bi) {
  if (!bi)
    throw new Error("BigInt unavailable, see https://github.com/timostamm/protobuf-ts/blob/v1.0.8/MANUAL.md#bigint-support");
}
var RE_DECIMAL_STR = /^-?[0-9]+$/;
var TWO_PWR_32_DBL2 = 4294967296;
var HALF_2_PWR_32 = 2147483648;
var SharedPbLong = class {
  /**
   * Create a new instance with the given bits.
   */
  constructor(lo, hi) {
    this.lo = lo | 0;
    this.hi = hi | 0;
  }
  /**
   * Is this instance equal to 0?
   */
  isZero() {
    return this.lo == 0 && this.hi == 0;
  }
  /**
   * Convert to a native number.
   */
  toNumber() {
    let result = this.hi * TWO_PWR_32_DBL2 + (this.lo >>> 0);
    if (!Number.isSafeInteger(result))
      throw new Error("cannot convert to safe number");
    return result;
  }
};
var PbULong = class _PbULong extends SharedPbLong {
  /**
   * Create instance from a `string`, `number` or `bigint`.
   */
  static from(value) {
    if (BI)
      switch (typeof value) {
        case "string":
          if (value == "0")
            return this.ZERO;
          if (value == "")
            throw new Error("string is no integer");
          value = BI.C(value);
        case "number":
          if (value === 0)
            return this.ZERO;
          value = BI.C(value);
        case "bigint":
          if (!value)
            return this.ZERO;
          if (value < BI.UMIN)
            throw new Error("signed value for ulong");
          if (value > BI.UMAX)
            throw new Error("ulong too large");
          BI.V.setBigUint64(0, value, true);
          return new _PbULong(BI.V.getInt32(0, true), BI.V.getInt32(4, true));
      }
    else
      switch (typeof value) {
        case "string":
          if (value == "0")
            return this.ZERO;
          value = value.trim();
          if (!RE_DECIMAL_STR.test(value))
            throw new Error("string is no integer");
          let [minus, lo, hi] = int64fromString(value);
          if (minus)
            throw new Error("signed value for ulong");
          return new _PbULong(lo, hi);
        case "number":
          if (value == 0)
            return this.ZERO;
          if (!Number.isSafeInteger(value))
            throw new Error("number is no integer");
          if (value < 0)
            throw new Error("signed value for ulong");
          return new _PbULong(value, value / TWO_PWR_32_DBL2);
      }
    throw new Error("unknown value " + typeof value);
  }
  /**
   * Convert to decimal string.
   */
  toString() {
    return BI ? this.toBigInt().toString() : int64toString(this.lo, this.hi);
  }
  /**
   * Convert to native bigint.
   */
  toBigInt() {
    assertBi(BI);
    BI.V.setInt32(0, this.lo, true);
    BI.V.setInt32(4, this.hi, true);
    return BI.V.getBigUint64(0, true);
  }
};
PbULong.ZERO = new PbULong(0, 0);
var PbLong = class _PbLong extends SharedPbLong {
  /**
   * Create instance from a `string`, `number` or `bigint`.
   */
  static from(value) {
    if (BI)
      switch (typeof value) {
        case "string":
          if (value == "0")
            return this.ZERO;
          if (value == "")
            throw new Error("string is no integer");
          value = BI.C(value);
        case "number":
          if (value === 0)
            return this.ZERO;
          value = BI.C(value);
        case "bigint":
          if (!value)
            return this.ZERO;
          if (value < BI.MIN)
            throw new Error("signed long too small");
          if (value > BI.MAX)
            throw new Error("signed long too large");
          BI.V.setBigInt64(0, value, true);
          return new _PbLong(BI.V.getInt32(0, true), BI.V.getInt32(4, true));
      }
    else
      switch (typeof value) {
        case "string":
          if (value == "0")
            return this.ZERO;
          value = value.trim();
          if (!RE_DECIMAL_STR.test(value))
            throw new Error("string is no integer");
          let [minus, lo, hi] = int64fromString(value);
          if (minus) {
            if (hi > HALF_2_PWR_32 || hi == HALF_2_PWR_32 && lo != 0)
              throw new Error("signed long too small");
          } else if (hi >= HALF_2_PWR_32)
            throw new Error("signed long too large");
          let pbl = new _PbLong(lo, hi);
          return minus ? pbl.negate() : pbl;
        case "number":
          if (value == 0)
            return this.ZERO;
          if (!Number.isSafeInteger(value))
            throw new Error("number is no integer");
          return value > 0 ? new _PbLong(value, value / TWO_PWR_32_DBL2) : new _PbLong(-value, -value / TWO_PWR_32_DBL2).negate();
      }
    throw new Error("unknown value " + typeof value);
  }
  /**
   * Do we have a minus sign?
   */
  isNegative() {
    return (this.hi & HALF_2_PWR_32) !== 0;
  }
  /**
   * Negate two's complement.
   * Invert all the bits and add one to the result.
   */
  negate() {
    let hi = ~this.hi, lo = this.lo;
    if (lo)
      lo = ~lo + 1;
    else
      hi += 1;
    return new _PbLong(lo, hi);
  }
  /**
   * Convert to decimal string.
   */
  toString() {
    if (BI)
      return this.toBigInt().toString();
    if (this.isNegative()) {
      let n = this.negate();
      return "-" + int64toString(n.lo, n.hi);
    }
    return int64toString(this.lo, this.hi);
  }
  /**
   * Convert to native bigint.
   */
  toBigInt() {
    assertBi(BI);
    BI.V.setInt32(0, this.lo, true);
    BI.V.setInt32(4, this.hi, true);
    return BI.V.getBigInt64(0, true);
  }
};
PbLong.ZERO = new PbLong(0, 0);

// node_modules/@protobuf-ts/runtime/build/es2015/binary-reader.js
var defaultsRead = {
  readUnknownField: true,
  readerFactory: (bytes) => new BinaryReader(bytes)
};
function binaryReadOptions(options) {
  return options ? Object.assign(Object.assign({}, defaultsRead), options) : defaultsRead;
}
var BinaryReader = class {
  constructor(buf, textDecoder) {
    this.varint64 = varint64read;
    this.uint32 = varint32read;
    this.buf = buf;
    this.len = buf.length;
    this.pos = 0;
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    this.textDecoder = textDecoder !== null && textDecoder !== void 0 ? textDecoder : new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true
    });
  }
  /**
   * Reads a tag - field number and wire type.
   */
  tag() {
    let tag = this.uint32(), fieldNo = tag >>> 3, wireType = tag & 7;
    if (fieldNo <= 0 || wireType < 0 || wireType > 5)
      throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
    return [fieldNo, wireType];
  }
  /**
   * Skip one element on the wire and return the skipped data.
   * Supports WireType.StartGroup since v2.0.0-alpha.23.
   */
  skip(wireType) {
    let start = this.pos;
    switch (wireType) {
      case WireType.Varint:
        while (this.buf[this.pos++] & 128) {
        }
        break;
      case WireType.Bit64:
        this.pos += 4;
      case WireType.Bit32:
        this.pos += 4;
        break;
      case WireType.LengthDelimited:
        let len = this.uint32();
        this.pos += len;
        break;
      case WireType.StartGroup:
        let t;
        while ((t = this.tag()[1]) !== WireType.EndGroup) {
          this.skip(t);
        }
        break;
      default:
        throw new Error("cant skip wire type " + wireType);
    }
    this.assertBounds();
    return this.buf.subarray(start, this.pos);
  }
  /**
   * Throws error if position in byte array is out of range.
   */
  assertBounds() {
    if (this.pos > this.len)
      throw new RangeError("premature EOF");
  }
  /**
   * Read a `int32` field, a signed 32 bit varint.
   */
  int32() {
    return this.uint32() | 0;
  }
  /**
   * Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
   */
  sint32() {
    let zze = this.uint32();
    return zze >>> 1 ^ -(zze & 1);
  }
  /**
   * Read a `int64` field, a signed 64-bit varint.
   */
  int64() {
    return new PbLong(...this.varint64());
  }
  /**
   * Read a `uint64` field, an unsigned 64-bit varint.
   */
  uint64() {
    return new PbULong(...this.varint64());
  }
  /**
   * Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64() {
    let [lo, hi] = this.varint64();
    let s = -(lo & 1);
    lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
    hi = hi >>> 1 ^ s;
    return new PbLong(lo, hi);
  }
  /**
   * Read a `bool` field, a variant.
   */
  bool() {
    let [lo, hi] = this.varint64();
    return lo !== 0 || hi !== 0;
  }
  /**
   * Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
   */
  fixed32() {
    return this.view.getUint32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
   */
  sfixed32() {
    return this.view.getInt32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
   */
  fixed64() {
    return new PbULong(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `fixed64` field, a signed, fixed-length 64-bit integer.
   */
  sfixed64() {
    return new PbLong(this.sfixed32(), this.sfixed32());
  }
  /**
   * Read a `float` field, 32-bit floating point number.
   */
  float() {
    return this.view.getFloat32((this.pos += 4) - 4, true);
  }
  /**
   * Read a `double` field, a 64-bit floating point number.
   */
  double() {
    return this.view.getFloat64((this.pos += 8) - 8, true);
  }
  /**
   * Read a `bytes` field, length-delimited arbitrary data.
   */
  bytes() {
    let len = this.uint32();
    let start = this.pos;
    this.pos += len;
    this.assertBounds();
    return this.buf.subarray(start, start + len);
  }
  /**
   * Read a `string` field, length-delimited data converted to UTF-8 text.
   */
  string() {
    return this.textDecoder.decode(this.bytes());
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/assert.js
function assert(condition, msg) {
  if (!condition) {
    throw new Error(msg);
  }
}
function assertNever(value, msg) {
  throw new Error(msg !== null && msg !== void 0 ? msg : "Unexpected object: " + value);
}
var FLOAT32_MAX = 34028234663852886e22;
var FLOAT32_MIN = -34028234663852886e22;
var UINT32_MAX = 4294967295;
var INT32_MAX = 2147483647;
var INT32_MIN = -2147483648;
function assertInt32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid int 32: " + typeof arg);
  if (!Number.isInteger(arg) || arg > INT32_MAX || arg < INT32_MIN)
    throw new Error("invalid int 32: " + arg);
}
function assertUInt32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid uint 32: " + typeof arg);
  if (!Number.isInteger(arg) || arg > UINT32_MAX || arg < 0)
    throw new Error("invalid uint 32: " + arg);
}
function assertFloat32(arg) {
  if (typeof arg !== "number")
    throw new Error("invalid float 32: " + typeof arg);
  if (!Number.isFinite(arg))
    return;
  if (arg > FLOAT32_MAX || arg < FLOAT32_MIN)
    throw new Error("invalid float 32: " + arg);
}

// node_modules/@protobuf-ts/runtime/build/es2015/binary-writer.js
var defaultsWrite = {
  writeUnknownFields: true,
  writerFactory: () => new BinaryWriter()
};
function binaryWriteOptions(options) {
  return options ? Object.assign(Object.assign({}, defaultsWrite), options) : defaultsWrite;
}
var BinaryWriter = class {
  constructor(textEncoder) {
    this.stack = [];
    this.textEncoder = textEncoder !== null && textEncoder !== void 0 ? textEncoder : new TextEncoder();
    this.chunks = [];
    this.buf = [];
  }
  /**
   * Return all bytes written and reset this writer.
   */
  finish() {
    this.chunks.push(new Uint8Array(this.buf));
    let len = 0;
    for (let i = 0; i < this.chunks.length; i++)
      len += this.chunks[i].length;
    let bytes = new Uint8Array(len);
    let offset = 0;
    for (let i = 0; i < this.chunks.length; i++) {
      bytes.set(this.chunks[i], offset);
      offset += this.chunks[i].length;
    }
    this.chunks = [];
    return bytes;
  }
  /**
   * Start a new fork for length-delimited data like a message
   * or a packed repeated field.
   *
   * Must be joined later with `join()`.
   */
  fork() {
    this.stack.push({ chunks: this.chunks, buf: this.buf });
    this.chunks = [];
    this.buf = [];
    return this;
  }
  /**
   * Join the last fork. Write its length and bytes, then
   * return to the previous state.
   */
  join() {
    let chunk = this.finish();
    let prev = this.stack.pop();
    if (!prev)
      throw new Error("invalid state, fork stack empty");
    this.chunks = prev.chunks;
    this.buf = prev.buf;
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  /**
   * Writes a tag (field number and wire type).
   *
   * Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
   *
   * Generated code should compute the tag ahead of time and call `uint32()`.
   */
  tag(fieldNo, type) {
    return this.uint32((fieldNo << 3 | type) >>> 0);
  }
  /**
   * Write a chunk of raw bytes.
   */
  raw(chunk) {
    if (this.buf.length) {
      this.chunks.push(new Uint8Array(this.buf));
      this.buf = [];
    }
    this.chunks.push(chunk);
    return this;
  }
  /**
   * Write a `uint32` value, an unsigned 32 bit varint.
   */
  uint32(value) {
    assertUInt32(value);
    while (value > 127) {
      this.buf.push(value & 127 | 128);
      value = value >>> 7;
    }
    this.buf.push(value);
    return this;
  }
  /**
   * Write a `int32` value, a signed 32 bit varint.
   */
  int32(value) {
    assertInt32(value);
    varint32write(value, this.buf);
    return this;
  }
  /**
   * Write a `bool` value, a variant.
   */
  bool(value) {
    this.buf.push(value ? 1 : 0);
    return this;
  }
  /**
   * Write a `bytes` value, length-delimited arbitrary data.
   */
  bytes(value) {
    this.uint32(value.byteLength);
    return this.raw(value);
  }
  /**
   * Write a `string` value, length-delimited data converted to UTF-8 text.
   */
  string(value) {
    let chunk = this.textEncoder.encode(value);
    this.uint32(chunk.byteLength);
    return this.raw(chunk);
  }
  /**
   * Write a `float` value, 32-bit floating point number.
   */
  float(value) {
    assertFloat32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setFloat32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `double` value, a 64-bit floating point number.
   */
  double(value) {
    let chunk = new Uint8Array(8);
    new DataView(chunk.buffer).setFloat64(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
   */
  fixed32(value) {
    assertUInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setUint32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
   */
  sfixed32(value) {
    assertInt32(value);
    let chunk = new Uint8Array(4);
    new DataView(chunk.buffer).setInt32(0, value, true);
    return this.raw(chunk);
  }
  /**
   * Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
   */
  sint32(value) {
    assertInt32(value);
    value = (value << 1 ^ value >> 31) >>> 0;
    varint32write(value, this.buf);
    return this;
  }
  /**
   * Write a `fixed64` value, a signed, fixed-length 64-bit integer.
   */
  sfixed64(value) {
    let chunk = new Uint8Array(8);
    let view = new DataView(chunk.buffer);
    let long = PbLong.from(value);
    view.setInt32(0, long.lo, true);
    view.setInt32(4, long.hi, true);
    return this.raw(chunk);
  }
  /**
   * Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
   */
  fixed64(value) {
    let chunk = new Uint8Array(8);
    let view = new DataView(chunk.buffer);
    let long = PbULong.from(value);
    view.setInt32(0, long.lo, true);
    view.setInt32(4, long.hi, true);
    return this.raw(chunk);
  }
  /**
   * Write a `int64` value, a signed 64-bit varint.
   */
  int64(value) {
    let long = PbLong.from(value);
    varint64write(long.lo, long.hi, this.buf);
    return this;
  }
  /**
   * Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
   */
  sint64(value) {
    let long = PbLong.from(value), sign = long.hi >> 31, lo = long.lo << 1 ^ sign, hi = (long.hi << 1 | long.lo >>> 31) ^ sign;
    varint64write(lo, hi, this.buf);
    return this;
  }
  /**
   * Write a `uint64` value, an unsigned 64-bit varint.
   */
  uint64(value) {
    let long = PbULong.from(value);
    varint64write(long.lo, long.hi, this.buf);
    return this;
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/json-format-contract.js
var defaultsWrite2 = {
  emitDefaultValues: false,
  enumAsInteger: false,
  useProtoFieldName: false,
  prettySpaces: 0
};
var defaultsRead2 = {
  ignoreUnknownFields: false
};
function jsonReadOptions(options) {
  return options ? Object.assign(Object.assign({}, defaultsRead2), options) : defaultsRead2;
}
function jsonWriteOptions(options) {
  return options ? Object.assign(Object.assign({}, defaultsWrite2), options) : defaultsWrite2;
}
function mergeJsonOptions(a, b) {
  var _a, _b;
  let c = Object.assign(Object.assign({}, a), b);
  c.typeRegistry = [...(_a = a === null || a === void 0 ? void 0 : a.typeRegistry) !== null && _a !== void 0 ? _a : [], ...(_b = b === null || b === void 0 ? void 0 : b.typeRegistry) !== null && _b !== void 0 ? _b : []];
  return c;
}

// node_modules/@protobuf-ts/runtime/build/es2015/message-type-contract.js
var MESSAGE_TYPE = /* @__PURE__ */ Symbol.for("protobuf-ts/message-type");

// node_modules/@protobuf-ts/runtime/build/es2015/lower-camel-case.js
function lowerCamelCase(snakeCase) {
  let capNext = false;
  const sb = [];
  for (let i = 0; i < snakeCase.length; i++) {
    let next = snakeCase.charAt(i);
    if (next == "_") {
      capNext = true;
    } else if (/\d/.test(next)) {
      sb.push(next);
      capNext = true;
    } else if (capNext) {
      sb.push(next.toUpperCase());
      capNext = false;
    } else if (i == 0) {
      sb.push(next.toLowerCase());
    } else {
      sb.push(next);
    }
  }
  return sb.join("");
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-info.js
var ScalarType;
(function(ScalarType2) {
  ScalarType2[ScalarType2["DOUBLE"] = 1] = "DOUBLE";
  ScalarType2[ScalarType2["FLOAT"] = 2] = "FLOAT";
  ScalarType2[ScalarType2["INT64"] = 3] = "INT64";
  ScalarType2[ScalarType2["UINT64"] = 4] = "UINT64";
  ScalarType2[ScalarType2["INT32"] = 5] = "INT32";
  ScalarType2[ScalarType2["FIXED64"] = 6] = "FIXED64";
  ScalarType2[ScalarType2["FIXED32"] = 7] = "FIXED32";
  ScalarType2[ScalarType2["BOOL"] = 8] = "BOOL";
  ScalarType2[ScalarType2["STRING"] = 9] = "STRING";
  ScalarType2[ScalarType2["BYTES"] = 12] = "BYTES";
  ScalarType2[ScalarType2["UINT32"] = 13] = "UINT32";
  ScalarType2[ScalarType2["SFIXED32"] = 15] = "SFIXED32";
  ScalarType2[ScalarType2["SFIXED64"] = 16] = "SFIXED64";
  ScalarType2[ScalarType2["SINT32"] = 17] = "SINT32";
  ScalarType2[ScalarType2["SINT64"] = 18] = "SINT64";
})(ScalarType || (ScalarType = {}));
var LongType;
(function(LongType2) {
  LongType2[LongType2["BIGINT"] = 0] = "BIGINT";
  LongType2[LongType2["STRING"] = 1] = "STRING";
  LongType2[LongType2["NUMBER"] = 2] = "NUMBER";
})(LongType || (LongType = {}));
var RepeatType;
(function(RepeatType2) {
  RepeatType2[RepeatType2["NO"] = 0] = "NO";
  RepeatType2[RepeatType2["PACKED"] = 1] = "PACKED";
  RepeatType2[RepeatType2["UNPACKED"] = 2] = "UNPACKED";
})(RepeatType || (RepeatType = {}));
function normalizeFieldInfo(field) {
  var _a, _b, _c, _d;
  field.localName = (_a = field.localName) !== null && _a !== void 0 ? _a : lowerCamelCase(field.name);
  field.jsonName = (_b = field.jsonName) !== null && _b !== void 0 ? _b : lowerCamelCase(field.name);
  field.repeat = (_c = field.repeat) !== null && _c !== void 0 ? _c : RepeatType.NO;
  field.opt = (_d = field.opt) !== null && _d !== void 0 ? _d : field.repeat ? false : field.oneof ? false : field.kind == "message";
  return field;
}

// node_modules/@protobuf-ts/runtime/build/es2015/oneof.js
function isOneofGroup(any) {
  if (typeof any != "object" || any === null || !any.hasOwnProperty("oneofKind")) {
    return false;
  }
  switch (typeof any.oneofKind) {
    case "string":
      if (any[any.oneofKind] === void 0)
        return false;
      return Object.keys(any).length == 2;
    case "undefined":
      return Object.keys(any).length == 1;
    default:
      return false;
  }
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-type-check.js
var ReflectionTypeCheck = class {
  constructor(info) {
    var _a;
    this.fields = (_a = info.fields) !== null && _a !== void 0 ? _a : [];
  }
  prepare() {
    if (this.data)
      return;
    const req = [], known = [], oneofs = [];
    for (let field of this.fields) {
      if (field.oneof) {
        if (!oneofs.includes(field.oneof)) {
          oneofs.push(field.oneof);
          req.push(field.oneof);
          known.push(field.oneof);
        }
      } else {
        known.push(field.localName);
        switch (field.kind) {
          case "scalar":
          case "enum":
            if (!field.opt || field.repeat)
              req.push(field.localName);
            break;
          case "message":
            if (field.repeat)
              req.push(field.localName);
            break;
          case "map":
            req.push(field.localName);
            break;
        }
      }
    }
    this.data = { req, known, oneofs: Object.values(oneofs) };
  }
  /**
   * Is the argument a valid message as specified by the
   * reflection information?
   *
   * Checks all field types recursively. The `depth`
   * specifies how deep into the structure the check will be.
   *
   * With a depth of 0, only the presence of fields
   * is checked.
   *
   * With a depth of 1 or more, the field types are checked.
   *
   * With a depth of 2 or more, the members of map, repeated
   * and message fields are checked.
   *
   * Message fields will be checked recursively with depth - 1.
   *
   * The number of map entries / repeated values being checked
   * is < depth.
   */
  is(message, depth, allowExcessProperties = false) {
    if (depth < 0)
      return true;
    if (message === null || message === void 0 || typeof message != "object")
      return false;
    this.prepare();
    let keys = Object.keys(message), data = this.data;
    if (keys.length < data.req.length || data.req.some((n) => !keys.includes(n)))
      return false;
    if (!allowExcessProperties) {
      if (keys.some((k) => !data.known.includes(k)))
        return false;
    }
    if (depth < 1) {
      return true;
    }
    for (const name of data.oneofs) {
      const group = message[name];
      if (!isOneofGroup(group))
        return false;
      if (group.oneofKind === void 0)
        continue;
      const field = this.fields.find((f) => f.localName === group.oneofKind);
      if (!field)
        return false;
      if (!this.field(group[group.oneofKind], field, allowExcessProperties, depth))
        return false;
    }
    for (const field of this.fields) {
      if (field.oneof !== void 0)
        continue;
      if (!this.field(message[field.localName], field, allowExcessProperties, depth))
        return false;
    }
    return true;
  }
  field(arg, field, allowExcessProperties, depth) {
    let repeated = field.repeat;
    switch (field.kind) {
      case "scalar":
        if (arg === void 0)
          return field.opt;
        if (repeated)
          return this.scalars(arg, field.T, depth, field.L);
        return this.scalar(arg, field.T, field.L);
      case "enum":
        if (arg === void 0)
          return field.opt;
        if (repeated)
          return this.scalars(arg, ScalarType.INT32, depth);
        return this.scalar(arg, ScalarType.INT32);
      case "message":
        if (arg === void 0)
          return true;
        if (repeated)
          return this.messages(arg, field.T(), allowExcessProperties, depth);
        return this.message(arg, field.T(), allowExcessProperties, depth);
      case "map":
        if (typeof arg != "object" || arg === null)
          return false;
        if (depth < 2)
          return true;
        if (!this.mapKeys(arg, field.K, depth))
          return false;
        switch (field.V.kind) {
          case "scalar":
            return this.scalars(Object.values(arg), field.V.T, depth, field.V.L);
          case "enum":
            return this.scalars(Object.values(arg), ScalarType.INT32, depth);
          case "message":
            return this.messages(Object.values(arg), field.V.T(), allowExcessProperties, depth);
        }
        break;
    }
    return true;
  }
  message(arg, type, allowExcessProperties, depth) {
    if (allowExcessProperties) {
      return type.isAssignable(arg, depth);
    }
    return type.is(arg, depth);
  }
  messages(arg, type, allowExcessProperties, depth) {
    if (!Array.isArray(arg))
      return false;
    if (depth < 2)
      return true;
    if (allowExcessProperties) {
      for (let i = 0; i < arg.length && i < depth; i++)
        if (!type.isAssignable(arg[i], depth - 1))
          return false;
    } else {
      for (let i = 0; i < arg.length && i < depth; i++)
        if (!type.is(arg[i], depth - 1))
          return false;
    }
    return true;
  }
  scalar(arg, type, longType) {
    let argType = typeof arg;
    switch (type) {
      case ScalarType.UINT64:
      case ScalarType.FIXED64:
      case ScalarType.INT64:
      case ScalarType.SFIXED64:
      case ScalarType.SINT64:
        switch (longType) {
          case LongType.BIGINT:
            return argType == "bigint";
          case LongType.NUMBER:
            return argType == "number" && !isNaN(arg);
          default:
            return argType == "string";
        }
      case ScalarType.BOOL:
        return argType == "boolean";
      case ScalarType.STRING:
        return argType == "string";
      case ScalarType.BYTES:
        return arg instanceof Uint8Array;
      case ScalarType.DOUBLE:
      case ScalarType.FLOAT:
        return argType == "number" && !isNaN(arg);
      default:
        return argType == "number" && Number.isInteger(arg);
    }
  }
  scalars(arg, type, depth, longType) {
    if (!Array.isArray(arg))
      return false;
    if (depth < 2)
      return true;
    if (Array.isArray(arg)) {
      for (let i = 0; i < arg.length && i < depth; i++)
        if (!this.scalar(arg[i], type, longType))
          return false;
    }
    return true;
  }
  mapKeys(map, type, depth) {
    let keys = Object.keys(map);
    switch (type) {
      case ScalarType.INT32:
      case ScalarType.FIXED32:
      case ScalarType.SFIXED32:
      case ScalarType.SINT32:
      case ScalarType.UINT32:
        return this.scalars(keys.slice(0, depth).map((k) => parseInt(k)), type, depth);
      case ScalarType.BOOL:
        return this.scalars(keys.slice(0, depth).map((k) => k == "true" ? true : k == "false" ? false : k), type, depth);
      default:
        return this.scalars(keys, type, depth, LongType.STRING);
    }
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-long-convert.js
function reflectionLongConvert(long, type) {
  switch (type) {
    case LongType.BIGINT:
      return long.toBigInt();
    case LongType.NUMBER:
      return long.toNumber();
    default:
      return long.toString();
  }
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-json-reader.js
var ReflectionJsonReader = class {
  constructor(info) {
    this.info = info;
  }
  prepare() {
    var _a;
    if (this.fMap === void 0) {
      this.fMap = {};
      const fieldsInput = (_a = this.info.fields) !== null && _a !== void 0 ? _a : [];
      for (const field of fieldsInput) {
        this.fMap[field.name] = field;
        this.fMap[field.jsonName] = field;
        this.fMap[field.localName] = field;
      }
    }
  }
  // Cannot parse JSON <type of jsonValue> for <type name>#<fieldName>.
  assert(condition, fieldName, jsonValue) {
    if (!condition) {
      let what = typeofJsonValue(jsonValue);
      if (what == "number" || what == "boolean")
        what = jsonValue.toString();
      throw new Error(`Cannot parse JSON ${what} for ${this.info.typeName}#${fieldName}`);
    }
  }
  /**
   * Reads a message from canonical JSON format into the target message.
   *
   * Repeated fields are appended. Map entries are added, overwriting
   * existing keys.
   *
   * If a message field is already present, it will be merged with the
   * new data.
   */
  read(input, message, options) {
    this.prepare();
    const oneofsHandled = [];
    for (const [jsonKey, jsonValue] of Object.entries(input)) {
      const field = this.fMap[jsonKey];
      if (!field) {
        if (!options.ignoreUnknownFields)
          throw new Error(`Found unknown field while reading ${this.info.typeName} from JSON format. JSON key: ${jsonKey}`);
        continue;
      }
      const localName = field.localName;
      let target;
      if (field.oneof) {
        if (jsonValue === null && (field.kind !== "enum" || field.T()[0] !== "google.protobuf.NullValue")) {
          continue;
        }
        if (oneofsHandled.includes(field.oneof))
          throw new Error(`Multiple members of the oneof group "${field.oneof}" of ${this.info.typeName} are present in JSON.`);
        oneofsHandled.push(field.oneof);
        target = message[field.oneof] = {
          oneofKind: localName
        };
      } else {
        target = message;
      }
      if (field.kind == "map") {
        if (jsonValue === null) {
          continue;
        }
        this.assert(isJsonObject(jsonValue), field.name, jsonValue);
        const fieldObj = target[localName];
        for (const [jsonObjKey, jsonObjValue] of Object.entries(jsonValue)) {
          this.assert(jsonObjValue !== null, field.name + " map value", null);
          let val;
          switch (field.V.kind) {
            case "message":
              val = field.V.T().internalJsonRead(jsonObjValue, options);
              break;
            case "enum":
              val = this.enum(field.V.T(), jsonObjValue, field.name, options.ignoreUnknownFields);
              if (val === false)
                continue;
              break;
            case "scalar":
              val = this.scalar(jsonObjValue, field.V.T, field.V.L, field.name);
              break;
          }
          this.assert(val !== void 0, field.name + " map value", jsonObjValue);
          let key = jsonObjKey;
          if (field.K == ScalarType.BOOL)
            key = key == "true" ? true : key == "false" ? false : key;
          key = this.scalar(key, field.K, LongType.STRING, field.name).toString();
          fieldObj[key] = val;
        }
      } else if (field.repeat) {
        if (jsonValue === null)
          continue;
        this.assert(Array.isArray(jsonValue), field.name, jsonValue);
        const fieldArr = target[localName];
        for (const jsonItem of jsonValue) {
          this.assert(jsonItem !== null, field.name, null);
          let val;
          switch (field.kind) {
            case "message":
              val = field.T().internalJsonRead(jsonItem, options);
              break;
            case "enum":
              val = this.enum(field.T(), jsonItem, field.name, options.ignoreUnknownFields);
              if (val === false)
                continue;
              break;
            case "scalar":
              val = this.scalar(jsonItem, field.T, field.L, field.name);
              break;
          }
          this.assert(val !== void 0, field.name, jsonValue);
          fieldArr.push(val);
        }
      } else {
        switch (field.kind) {
          case "message":
            if (jsonValue === null && field.T().typeName != "google.protobuf.Value") {
              this.assert(field.oneof === void 0, field.name + " (oneof member)", null);
              continue;
            }
            target[localName] = field.T().internalJsonRead(jsonValue, options, target[localName]);
            break;
          case "enum":
            if (jsonValue === null)
              continue;
            let val = this.enum(field.T(), jsonValue, field.name, options.ignoreUnknownFields);
            if (val === false)
              continue;
            target[localName] = val;
            break;
          case "scalar":
            if (jsonValue === null)
              continue;
            target[localName] = this.scalar(jsonValue, field.T, field.L, field.name);
            break;
        }
      }
    }
  }
  /**
   * Returns `false` for unrecognized string representations.
   *
   * google.protobuf.NullValue accepts only JSON `null` (or the old `"NULL_VALUE"`).
   */
  enum(type, json, fieldName, ignoreUnknownFields) {
    if (type[0] == "google.protobuf.NullValue")
      assert(json === null || json === "NULL_VALUE", `Unable to parse field ${this.info.typeName}#${fieldName}, enum ${type[0]} only accepts null.`);
    if (json === null)
      return 0;
    switch (typeof json) {
      case "number":
        assert(Number.isInteger(json), `Unable to parse field ${this.info.typeName}#${fieldName}, enum can only be integral number, got ${json}.`);
        return json;
      case "string":
        let localEnumName = json;
        if (type[2] && json.substring(0, type[2].length) === type[2])
          localEnumName = json.substring(type[2].length);
        let enumNumber = type[1][localEnumName];
        if (typeof enumNumber === "undefined" && ignoreUnknownFields) {
          return false;
        }
        assert(typeof enumNumber == "number", `Unable to parse field ${this.info.typeName}#${fieldName}, enum ${type[0]} has no value for "${json}".`);
        return enumNumber;
    }
    assert(false, `Unable to parse field ${this.info.typeName}#${fieldName}, cannot parse enum value from ${typeof json}".`);
  }
  scalar(json, type, longType, fieldName) {
    let e;
    try {
      switch (type) {
        // float, double: JSON value will be a number or one of the special string values "NaN", "Infinity", and "-Infinity".
        // Either numbers or strings are accepted. Exponent notation is also accepted.
        case ScalarType.DOUBLE:
        case ScalarType.FLOAT:
          if (json === null)
            return 0;
          if (json === "NaN")
            return Number.NaN;
          if (json === "Infinity")
            return Number.POSITIVE_INFINITY;
          if (json === "-Infinity")
            return Number.NEGATIVE_INFINITY;
          if (json === "") {
            e = "empty string";
            break;
          }
          if (typeof json == "string" && json.trim().length !== json.length) {
            e = "extra whitespace";
            break;
          }
          if (typeof json != "string" && typeof json != "number") {
            break;
          }
          let float = Number(json);
          if (Number.isNaN(float)) {
            e = "not a number";
            break;
          }
          if (!Number.isFinite(float)) {
            e = "too large or small";
            break;
          }
          if (type == ScalarType.FLOAT)
            assertFloat32(float);
          return float;
        // int32, fixed32, uint32: JSON value will be a decimal number. Either numbers or strings are accepted.
        case ScalarType.INT32:
        case ScalarType.FIXED32:
        case ScalarType.SFIXED32:
        case ScalarType.SINT32:
        case ScalarType.UINT32:
          if (json === null)
            return 0;
          let int32;
          if (typeof json == "number")
            int32 = json;
          else if (json === "")
            e = "empty string";
          else if (typeof json == "string") {
            if (json.trim().length !== json.length)
              e = "extra whitespace";
            else
              int32 = Number(json);
          }
          if (int32 === void 0)
            break;
          if (type == ScalarType.UINT32)
            assertUInt32(int32);
          else
            assertInt32(int32);
          return int32;
        // int64, fixed64, uint64: JSON value will be a decimal string. Either numbers or strings are accepted.
        case ScalarType.INT64:
        case ScalarType.SFIXED64:
        case ScalarType.SINT64:
          if (json === null)
            return reflectionLongConvert(PbLong.ZERO, longType);
          if (typeof json != "number" && typeof json != "string")
            break;
          return reflectionLongConvert(PbLong.from(json), longType);
        case ScalarType.FIXED64:
        case ScalarType.UINT64:
          if (json === null)
            return reflectionLongConvert(PbULong.ZERO, longType);
          if (typeof json != "number" && typeof json != "string")
            break;
          return reflectionLongConvert(PbULong.from(json), longType);
        // bool:
        case ScalarType.BOOL:
          if (json === null)
            return false;
          if (typeof json !== "boolean")
            break;
          return json;
        // string:
        case ScalarType.STRING:
          if (json === null)
            return "";
          if (typeof json !== "string") {
            e = "extra whitespace";
            break;
          }
          try {
            encodeURIComponent(json);
          } catch (e2) {
            e2 = "invalid UTF8";
            break;
          }
          return json;
        // bytes: JSON value will be the data encoded as a string using standard base64 encoding with paddings.
        // Either standard or URL-safe base64 encoding with/without paddings are accepted.
        case ScalarType.BYTES:
          if (json === null || json === "")
            return new Uint8Array(0);
          if (typeof json !== "string")
            break;
          return base64decode(json);
      }
    } catch (error) {
      e = error.message;
    }
    this.assert(false, fieldName + (e ? " - " + e : ""), json);
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-json-writer.js
var ReflectionJsonWriter = class {
  constructor(info) {
    var _a;
    this.fields = (_a = info.fields) !== null && _a !== void 0 ? _a : [];
  }
  /**
   * Converts the message to a JSON object, based on the field descriptors.
   */
  write(message, options) {
    const json = {}, source = message;
    for (const field of this.fields) {
      if (!field.oneof) {
        let jsonValue2 = this.field(field, source[field.localName], options);
        if (jsonValue2 !== void 0)
          json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue2;
        continue;
      }
      const group = source[field.oneof];
      if (group.oneofKind !== field.localName)
        continue;
      const opt = field.kind == "scalar" || field.kind == "enum" ? Object.assign(Object.assign({}, options), { emitDefaultValues: true }) : options;
      let jsonValue = this.field(field, group[field.localName], opt);
      assert(jsonValue !== void 0);
      json[options.useProtoFieldName ? field.name : field.jsonName] = jsonValue;
    }
    return json;
  }
  field(field, value, options) {
    let jsonValue = void 0;
    if (field.kind == "map") {
      assert(typeof value == "object" && value !== null);
      const jsonObj = {};
      switch (field.V.kind) {
        case "scalar":
          for (const [entryKey, entryValue] of Object.entries(value)) {
            const val = this.scalar(field.V.T, entryValue, field.name, false, true);
            assert(val !== void 0);
            jsonObj[entryKey.toString()] = val;
          }
          break;
        case "message":
          const messageType = field.V.T();
          for (const [entryKey, entryValue] of Object.entries(value)) {
            const val = this.message(messageType, entryValue, field.name, options);
            assert(val !== void 0);
            jsonObj[entryKey.toString()] = val;
          }
          break;
        case "enum":
          const enumInfo = field.V.T();
          for (const [entryKey, entryValue] of Object.entries(value)) {
            assert(entryValue === void 0 || typeof entryValue == "number");
            const val = this.enum(enumInfo, entryValue, field.name, false, true, options.enumAsInteger);
            assert(val !== void 0);
            jsonObj[entryKey.toString()] = val;
          }
          break;
      }
      if (options.emitDefaultValues || Object.keys(jsonObj).length > 0)
        jsonValue = jsonObj;
    } else if (field.repeat) {
      assert(Array.isArray(value));
      const jsonArr = [];
      switch (field.kind) {
        case "scalar":
          for (let i = 0; i < value.length; i++) {
            const val = this.scalar(field.T, value[i], field.name, field.opt, true);
            assert(val !== void 0);
            jsonArr.push(val);
          }
          break;
        case "enum":
          const enumInfo = field.T();
          for (let i = 0; i < value.length; i++) {
            assert(value[i] === void 0 || typeof value[i] == "number");
            const val = this.enum(enumInfo, value[i], field.name, field.opt, true, options.enumAsInteger);
            assert(val !== void 0);
            jsonArr.push(val);
          }
          break;
        case "message":
          const messageType = field.T();
          for (let i = 0; i < value.length; i++) {
            const val = this.message(messageType, value[i], field.name, options);
            assert(val !== void 0);
            jsonArr.push(val);
          }
          break;
      }
      if (options.emitDefaultValues || jsonArr.length > 0 || options.emitDefaultValues)
        jsonValue = jsonArr;
    } else {
      switch (field.kind) {
        case "scalar":
          jsonValue = this.scalar(field.T, value, field.name, field.opt, options.emitDefaultValues);
          break;
        case "enum":
          jsonValue = this.enum(field.T(), value, field.name, field.opt, options.emitDefaultValues, options.enumAsInteger);
          break;
        case "message":
          jsonValue = this.message(field.T(), value, field.name, options);
          break;
      }
    }
    return jsonValue;
  }
  /**
   * Returns `null` as the default for google.protobuf.NullValue.
   */
  enum(type, value, fieldName, optional, emitDefaultValues, enumAsInteger) {
    if (type[0] == "google.protobuf.NullValue")
      return !emitDefaultValues && !optional ? void 0 : null;
    if (value === void 0) {
      assert(optional);
      return void 0;
    }
    if (value === 0 && !emitDefaultValues && !optional)
      return void 0;
    assert(typeof value == "number");
    assert(Number.isInteger(value));
    if (enumAsInteger || !type[1].hasOwnProperty(value))
      return value;
    if (type[2])
      return type[2] + type[1][value];
    return type[1][value];
  }
  message(type, value, fieldName, options) {
    if (value === void 0)
      return options.emitDefaultValues ? null : void 0;
    return type.internalJsonWrite(value, options);
  }
  scalar(type, value, fieldName, optional, emitDefaultValues) {
    if (value === void 0) {
      assert(optional);
      return void 0;
    }
    const ed = emitDefaultValues || optional;
    switch (type) {
      // int32, fixed32, uint32: JSON value will be a decimal number. Either numbers or strings are accepted.
      case ScalarType.INT32:
      case ScalarType.SFIXED32:
      case ScalarType.SINT32:
        if (value === 0)
          return ed ? 0 : void 0;
        assertInt32(value);
        return value;
      case ScalarType.FIXED32:
      case ScalarType.UINT32:
        if (value === 0)
          return ed ? 0 : void 0;
        assertUInt32(value);
        return value;
      // float, double: JSON value will be a number or one of the special string values "NaN", "Infinity", and "-Infinity".
      // Either numbers or strings are accepted. Exponent notation is also accepted.
      case ScalarType.FLOAT:
        assertFloat32(value);
      case ScalarType.DOUBLE:
        if (value === 0)
          return ed ? 0 : void 0;
        assert(typeof value == "number");
        if (Number.isNaN(value))
          return "NaN";
        if (value === Number.POSITIVE_INFINITY)
          return "Infinity";
        if (value === Number.NEGATIVE_INFINITY)
          return "-Infinity";
        return value;
      // string:
      case ScalarType.STRING:
        if (value === "")
          return ed ? "" : void 0;
        assert(typeof value == "string");
        return value;
      // bool:
      case ScalarType.BOOL:
        if (value === false)
          return ed ? false : void 0;
        assert(typeof value == "boolean");
        return value;
      // JSON value will be a decimal string. Either numbers or strings are accepted.
      case ScalarType.UINT64:
      case ScalarType.FIXED64:
        assert(typeof value == "number" || typeof value == "string" || typeof value == "bigint");
        let ulong = PbULong.from(value);
        if (ulong.isZero() && !ed)
          return void 0;
        return ulong.toString();
      // JSON value will be a decimal string. Either numbers or strings are accepted.
      case ScalarType.INT64:
      case ScalarType.SFIXED64:
      case ScalarType.SINT64:
        assert(typeof value == "number" || typeof value == "string" || typeof value == "bigint");
        let long = PbLong.from(value);
        if (long.isZero() && !ed)
          return void 0;
        return long.toString();
      // bytes: JSON value will be the data encoded as a string using standard base64 encoding with paddings.
      // Either standard or URL-safe base64 encoding with/without paddings are accepted.
      case ScalarType.BYTES:
        assert(value instanceof Uint8Array);
        if (!value.byteLength)
          return ed ? "" : void 0;
        return base64encode(value);
    }
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-scalar-default.js
function reflectionScalarDefault(type, longType = LongType.STRING) {
  switch (type) {
    case ScalarType.BOOL:
      return false;
    case ScalarType.UINT64:
    case ScalarType.FIXED64:
      return reflectionLongConvert(PbULong.ZERO, longType);
    case ScalarType.INT64:
    case ScalarType.SFIXED64:
    case ScalarType.SINT64:
      return reflectionLongConvert(PbLong.ZERO, longType);
    case ScalarType.DOUBLE:
    case ScalarType.FLOAT:
      return 0;
    case ScalarType.BYTES:
      return new Uint8Array(0);
    case ScalarType.STRING:
      return "";
    default:
      return 0;
  }
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-binary-reader.js
var ReflectionBinaryReader = class {
  constructor(info) {
    this.info = info;
  }
  prepare() {
    var _a;
    if (!this.fieldNoToField) {
      const fieldsInput = (_a = this.info.fields) !== null && _a !== void 0 ? _a : [];
      this.fieldNoToField = new Map(fieldsInput.map((field) => [field.no, field]));
    }
  }
  /**
   * Reads a message from binary format into the target message.
   *
   * Repeated fields are appended. Map entries are added, overwriting
   * existing keys.
   *
   * If a message field is already present, it will be merged with the
   * new data.
   */
  read(reader, message, options, length) {
    this.prepare();
    const end = length === void 0 ? reader.len : reader.pos + length;
    while (reader.pos < end) {
      const [fieldNo, wireType] = reader.tag(), field = this.fieldNoToField.get(fieldNo);
      if (!field) {
        let u = options.readUnknownField;
        if (u == "throw")
          throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.info.typeName}`);
        let d = reader.skip(wireType);
        if (u !== false)
          (u === true ? UnknownFieldHandler.onRead : u)(this.info.typeName, message, fieldNo, wireType, d);
        continue;
      }
      let target = message, repeated = field.repeat, localName = field.localName;
      if (field.oneof) {
        target = target[field.oneof];
        if (target.oneofKind !== localName)
          target = message[field.oneof] = {
            oneofKind: localName
          };
      }
      switch (field.kind) {
        case "scalar":
        case "enum":
          let T = field.kind == "enum" ? ScalarType.INT32 : field.T;
          let L = field.kind == "scalar" ? field.L : void 0;
          if (repeated) {
            let arr = target[localName];
            if (wireType == WireType.LengthDelimited && T != ScalarType.STRING && T != ScalarType.BYTES) {
              let e = reader.uint32() + reader.pos;
              while (reader.pos < e)
                arr.push(this.scalar(reader, T, L));
            } else
              arr.push(this.scalar(reader, T, L));
          } else
            target[localName] = this.scalar(reader, T, L);
          break;
        case "message":
          if (repeated) {
            let arr = target[localName];
            let msg = field.T().internalBinaryRead(reader, reader.uint32(), options);
            arr.push(msg);
          } else
            target[localName] = field.T().internalBinaryRead(reader, reader.uint32(), options, target[localName]);
          break;
        case "map":
          let [mapKey, mapVal] = this.mapEntry(field, reader, options);
          target[localName][mapKey] = mapVal;
          break;
      }
    }
  }
  /**
   * Read a map field, expecting key field = 1, value field = 2
   */
  mapEntry(field, reader, options) {
    let length = reader.uint32();
    let end = reader.pos + length;
    let key = void 0;
    let val = void 0;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          if (field.K == ScalarType.BOOL)
            key = reader.bool().toString();
          else
            key = this.scalar(reader, field.K, LongType.STRING);
          break;
        case 2:
          switch (field.V.kind) {
            case "scalar":
              val = this.scalar(reader, field.V.T, field.V.L);
              break;
            case "enum":
              val = reader.int32();
              break;
            case "message":
              val = field.V.T().internalBinaryRead(reader, reader.uint32(), options);
              break;
          }
          break;
        default:
          throw new Error(`Unknown field ${fieldNo} (wire type ${wireType}) in map entry for ${this.info.typeName}#${field.name}`);
      }
    }
    if (key === void 0) {
      let keyRaw = reflectionScalarDefault(field.K);
      key = field.K == ScalarType.BOOL ? keyRaw.toString() : keyRaw;
    }
    if (val === void 0)
      switch (field.V.kind) {
        case "scalar":
          val = reflectionScalarDefault(field.V.T, field.V.L);
          break;
        case "enum":
          val = 0;
          break;
        case "message":
          val = field.V.T().create();
          break;
      }
    return [key, val];
  }
  scalar(reader, type, longType) {
    switch (type) {
      case ScalarType.INT32:
        return reader.int32();
      case ScalarType.STRING:
        return reader.string();
      case ScalarType.BOOL:
        return reader.bool();
      case ScalarType.DOUBLE:
        return reader.double();
      case ScalarType.FLOAT:
        return reader.float();
      case ScalarType.INT64:
        return reflectionLongConvert(reader.int64(), longType);
      case ScalarType.UINT64:
        return reflectionLongConvert(reader.uint64(), longType);
      case ScalarType.FIXED64:
        return reflectionLongConvert(reader.fixed64(), longType);
      case ScalarType.FIXED32:
        return reader.fixed32();
      case ScalarType.BYTES:
        return reader.bytes();
      case ScalarType.UINT32:
        return reader.uint32();
      case ScalarType.SFIXED32:
        return reader.sfixed32();
      case ScalarType.SFIXED64:
        return reflectionLongConvert(reader.sfixed64(), longType);
      case ScalarType.SINT32:
        return reader.sint32();
      case ScalarType.SINT64:
        return reflectionLongConvert(reader.sint64(), longType);
    }
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-binary-writer.js
var ReflectionBinaryWriter = class {
  constructor(info) {
    this.info = info;
  }
  prepare() {
    if (!this.fields) {
      const fieldsInput = this.info.fields ? this.info.fields.concat() : [];
      this.fields = fieldsInput.sort((a, b) => a.no - b.no);
    }
  }
  /**
   * Writes the message to binary format.
   */
  write(message, writer, options) {
    this.prepare();
    for (const field of this.fields) {
      let value, emitDefault, repeated = field.repeat, localName = field.localName;
      if (field.oneof) {
        const group = message[field.oneof];
        if (group.oneofKind !== localName)
          continue;
        value = group[localName];
        emitDefault = true;
      } else {
        value = message[localName];
        emitDefault = false;
      }
      switch (field.kind) {
        case "scalar":
        case "enum":
          let T = field.kind == "enum" ? ScalarType.INT32 : field.T;
          if (repeated) {
            assert(Array.isArray(value));
            if (repeated == RepeatType.PACKED)
              this.packed(writer, T, field.no, value);
            else
              for (const item of value)
                this.scalar(writer, T, field.no, item, true);
          } else if (value === void 0)
            assert(field.opt);
          else
            this.scalar(writer, T, field.no, value, emitDefault || field.opt);
          break;
        case "message":
          if (repeated) {
            assert(Array.isArray(value));
            for (const item of value)
              this.message(writer, options, field.T(), field.no, item);
          } else {
            this.message(writer, options, field.T(), field.no, value);
          }
          break;
        case "map":
          assert(typeof value == "object" && value !== null);
          for (const [key, val] of Object.entries(value))
            this.mapEntry(writer, options, field, key, val);
          break;
      }
    }
    let u = options.writeUnknownFields;
    if (u !== false)
      (u === true ? UnknownFieldHandler.onWrite : u)(this.info.typeName, message, writer);
  }
  mapEntry(writer, options, field, key, value) {
    writer.tag(field.no, WireType.LengthDelimited);
    writer.fork();
    let keyValue = key;
    switch (field.K) {
      case ScalarType.INT32:
      case ScalarType.FIXED32:
      case ScalarType.UINT32:
      case ScalarType.SFIXED32:
      case ScalarType.SINT32:
        keyValue = Number.parseInt(key);
        break;
      case ScalarType.BOOL:
        assert(key == "true" || key == "false");
        keyValue = key == "true";
        break;
    }
    this.scalar(writer, field.K, 1, keyValue, true);
    switch (field.V.kind) {
      case "scalar":
        this.scalar(writer, field.V.T, 2, value, true);
        break;
      case "enum":
        this.scalar(writer, ScalarType.INT32, 2, value, true);
        break;
      case "message":
        this.message(writer, options, field.V.T(), 2, value);
        break;
    }
    writer.join();
  }
  message(writer, options, handler, fieldNo, value) {
    if (value === void 0)
      return;
    handler.internalBinaryWrite(value, writer.tag(fieldNo, WireType.LengthDelimited).fork(), options);
    writer.join();
  }
  /**
   * Write a single scalar value.
   */
  scalar(writer, type, fieldNo, value, emitDefault) {
    let [wireType, method, isDefault] = this.scalarInfo(type, value);
    if (!isDefault || emitDefault) {
      writer.tag(fieldNo, wireType);
      writer[method](value);
    }
  }
  /**
   * Write an array of scalar values in packed format.
   */
  packed(writer, type, fieldNo, value) {
    if (!value.length)
      return;
    assert(type !== ScalarType.BYTES && type !== ScalarType.STRING);
    writer.tag(fieldNo, WireType.LengthDelimited);
    writer.fork();
    let [, method] = this.scalarInfo(type);
    for (let i = 0; i < value.length; i++)
      writer[method](value[i]);
    writer.join();
  }
  /**
   * Get information for writing a scalar value.
   *
   * Returns tuple:
   * [0]: appropriate WireType
   * [1]: name of the appropriate method of IBinaryWriter
   * [2]: whether the given value is a default value
   *
   * If argument `value` is omitted, [2] is always false.
   */
  scalarInfo(type, value) {
    let t = WireType.Varint;
    let m;
    let i = value === void 0;
    let d = value === 0;
    switch (type) {
      case ScalarType.INT32:
        m = "int32";
        break;
      case ScalarType.STRING:
        d = i || !value.length;
        t = WireType.LengthDelimited;
        m = "string";
        break;
      case ScalarType.BOOL:
        d = value === false;
        m = "bool";
        break;
      case ScalarType.UINT32:
        m = "uint32";
        break;
      case ScalarType.DOUBLE:
        t = WireType.Bit64;
        m = "double";
        break;
      case ScalarType.FLOAT:
        t = WireType.Bit32;
        m = "float";
        break;
      case ScalarType.INT64:
        d = i || PbLong.from(value).isZero();
        m = "int64";
        break;
      case ScalarType.UINT64:
        d = i || PbULong.from(value).isZero();
        m = "uint64";
        break;
      case ScalarType.FIXED64:
        d = i || PbULong.from(value).isZero();
        t = WireType.Bit64;
        m = "fixed64";
        break;
      case ScalarType.BYTES:
        d = i || !value.byteLength;
        t = WireType.LengthDelimited;
        m = "bytes";
        break;
      case ScalarType.FIXED32:
        t = WireType.Bit32;
        m = "fixed32";
        break;
      case ScalarType.SFIXED32:
        t = WireType.Bit32;
        m = "sfixed32";
        break;
      case ScalarType.SFIXED64:
        d = i || PbLong.from(value).isZero();
        t = WireType.Bit64;
        m = "sfixed64";
        break;
      case ScalarType.SINT32:
        m = "sint32";
        break;
      case ScalarType.SINT64:
        d = i || PbLong.from(value).isZero();
        m = "sint64";
        break;
    }
    return [t, m, i || d];
  }
};

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-create.js
function reflectionCreate(type) {
  const msg = type.messagePrototype ? Object.create(type.messagePrototype) : Object.defineProperty({}, MESSAGE_TYPE, { value: type });
  for (let field of type.fields) {
    let name = field.localName;
    if (field.opt)
      continue;
    if (field.oneof)
      msg[field.oneof] = { oneofKind: void 0 };
    else if (field.repeat)
      msg[name] = [];
    else
      switch (field.kind) {
        case "scalar":
          msg[name] = reflectionScalarDefault(field.T, field.L);
          break;
        case "enum":
          msg[name] = 0;
          break;
        case "map":
          msg[name] = {};
          break;
      }
  }
  return msg;
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-merge-partial.js
function reflectionMergePartial(info, target, source) {
  let fieldValue, input = source, output;
  for (let field of info.fields) {
    let name = field.localName;
    if (field.oneof) {
      const group = input[field.oneof];
      if ((group === null || group === void 0 ? void 0 : group.oneofKind) == void 0) {
        continue;
      }
      fieldValue = group[name];
      output = target[field.oneof];
      output.oneofKind = group.oneofKind;
      if (fieldValue == void 0) {
        delete output[name];
        continue;
      }
    } else {
      fieldValue = input[name];
      output = target;
      if (fieldValue == void 0) {
        continue;
      }
    }
    if (field.repeat)
      output[name].length = fieldValue.length;
    switch (field.kind) {
      case "scalar":
      case "enum":
        if (field.repeat)
          for (let i = 0; i < fieldValue.length; i++)
            output[name][i] = fieldValue[i];
        else
          output[name] = fieldValue;
        break;
      case "message":
        let T = field.T();
        if (field.repeat)
          for (let i = 0; i < fieldValue.length; i++)
            output[name][i] = T.create(fieldValue[i]);
        else if (output[name] === void 0)
          output[name] = T.create(fieldValue);
        else
          T.mergePartial(output[name], fieldValue);
        break;
      case "map":
        switch (field.V.kind) {
          case "scalar":
          case "enum":
            Object.assign(output[name], fieldValue);
            break;
          case "message":
            let T2 = field.V.T();
            for (let k of Object.keys(fieldValue))
              output[name][k] = T2.create(fieldValue[k]);
            break;
        }
        break;
    }
  }
}

// node_modules/@protobuf-ts/runtime/build/es2015/reflection-equals.js
function reflectionEquals(info, a, b) {
  if (a === b)
    return true;
  if (!a || !b)
    return false;
  for (let field of info.fields) {
    let localName = field.localName;
    let val_a = field.oneof ? a[field.oneof][localName] : a[localName];
    let val_b = field.oneof ? b[field.oneof][localName] : b[localName];
    switch (field.kind) {
      case "enum":
      case "scalar":
        let t = field.kind == "enum" ? ScalarType.INT32 : field.T;
        if (!(field.repeat ? repeatedPrimitiveEq(t, val_a, val_b) : primitiveEq(t, val_a, val_b)))
          return false;
        break;
      case "map":
        if (!(field.V.kind == "message" ? repeatedMsgEq(field.V.T(), objectValues(val_a), objectValues(val_b)) : repeatedPrimitiveEq(field.V.kind == "enum" ? ScalarType.INT32 : field.V.T, objectValues(val_a), objectValues(val_b))))
          return false;
        break;
      case "message":
        let T = field.T();
        if (!(field.repeat ? repeatedMsgEq(T, val_a, val_b) : T.equals(val_a, val_b)))
          return false;
        break;
    }
  }
  return true;
}
var objectValues = Object.values;
function primitiveEq(type, a, b) {
  if (a === b)
    return true;
  if (type !== ScalarType.BYTES)
    return false;
  let ba = a;
  let bb = b;
  if (ba.length !== bb.length)
    return false;
  for (let i = 0; i < ba.length; i++)
    if (ba[i] != bb[i])
      return false;
  return true;
}
function repeatedPrimitiveEq(type, a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (!primitiveEq(type, a[i], b[i]))
      return false;
  return true;
}
function repeatedMsgEq(type, a, b) {
  if (a.length !== b.length)
    return false;
  for (let i = 0; i < a.length; i++)
    if (!type.equals(a[i], b[i]))
      return false;
  return true;
}

// node_modules/@protobuf-ts/runtime/build/es2015/message-type.js
var baseDescriptors = Object.getOwnPropertyDescriptors(Object.getPrototypeOf({}));
var messageTypeDescriptor = baseDescriptors[MESSAGE_TYPE] = {};
var MessageType = class {
  constructor(name, fields, options) {
    this.defaultCheckDepth = 16;
    this.typeName = name;
    this.fields = fields.map(normalizeFieldInfo);
    this.options = options !== null && options !== void 0 ? options : {};
    messageTypeDescriptor.value = this;
    this.messagePrototype = Object.create(null, baseDescriptors);
    this.refTypeCheck = new ReflectionTypeCheck(this);
    this.refJsonReader = new ReflectionJsonReader(this);
    this.refJsonWriter = new ReflectionJsonWriter(this);
    this.refBinReader = new ReflectionBinaryReader(this);
    this.refBinWriter = new ReflectionBinaryWriter(this);
  }
  create(value) {
    let message = reflectionCreate(this);
    if (value !== void 0) {
      reflectionMergePartial(this, message, value);
    }
    return message;
  }
  /**
   * Clone the message.
   *
   * Unknown fields are discarded.
   */
  clone(message) {
    let copy2 = this.create();
    reflectionMergePartial(this, copy2, message);
    return copy2;
  }
  /**
   * Determines whether two message of the same type have the same field values.
   * Checks for deep equality, traversing repeated fields, oneof groups, maps
   * and messages recursively.
   * Will also return true if both messages are `undefined`.
   */
  equals(a, b) {
    return reflectionEquals(this, a, b);
  }
  /**
   * Is the given value assignable to our message type
   * and contains no [excess properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)?
   */
  is(arg, depth = this.defaultCheckDepth) {
    return this.refTypeCheck.is(arg, depth, false);
  }
  /**
   * Is the given value assignable to our message type,
   * regardless of [excess properties](https://www.typescriptlang.org/docs/handbook/interfaces.html#excess-property-checks)?
   */
  isAssignable(arg, depth = this.defaultCheckDepth) {
    return this.refTypeCheck.is(arg, depth, true);
  }
  /**
   * Copy partial data into the target message.
   */
  mergePartial(target, source) {
    reflectionMergePartial(this, target, source);
  }
  /**
   * Create a new message from binary format.
   */
  fromBinary(data, options) {
    let opt = binaryReadOptions(options);
    return this.internalBinaryRead(opt.readerFactory(data), data.byteLength, opt);
  }
  /**
   * Read a new message from a JSON value.
   */
  fromJson(json, options) {
    return this.internalJsonRead(json, jsonReadOptions(options));
  }
  /**
   * Read a new message from a JSON string.
   * This is equivalent to `T.fromJson(JSON.parse(json))`.
   */
  fromJsonString(json, options) {
    let value = JSON.parse(json);
    return this.fromJson(value, options);
  }
  /**
   * Write the message to canonical JSON value.
   */
  toJson(message, options) {
    return this.internalJsonWrite(message, jsonWriteOptions(options));
  }
  /**
   * Convert the message to canonical JSON string.
   * This is equivalent to `JSON.stringify(T.toJson(t))`
   */
  toJsonString(message, options) {
    var _a;
    let value = this.toJson(message, options);
    return JSON.stringify(value, null, (_a = options === null || options === void 0 ? void 0 : options.prettySpaces) !== null && _a !== void 0 ? _a : 0);
  }
  /**
   * Write the message to binary format.
   */
  toBinary(message, options) {
    let opt = binaryWriteOptions(options);
    return this.internalBinaryWrite(message, opt.writerFactory(), opt).finish();
  }
  /**
   * This is an internal method. If you just want to read a message from
   * JSON, use `fromJson()` or `fromJsonString()`.
   *
   * Reads JSON value and merges the fields into the target
   * according to protobuf rules. If the target is omitted,
   * a new instance is created first.
   */
  internalJsonRead(json, options, target) {
    if (json !== null && typeof json == "object" && !Array.isArray(json)) {
      let message = target !== null && target !== void 0 ? target : this.create();
      this.refJsonReader.read(json, message, options);
      return message;
    }
    throw new Error(`Unable to parse message ${this.typeName} from JSON ${typeofJsonValue(json)}.`);
  }
  /**
   * This is an internal method. If you just want to write a message
   * to JSON, use `toJson()` or `toJsonString().
   *
   * Writes JSON value and returns it.
   */
  internalJsonWrite(message, options) {
    return this.refJsonWriter.write(message, options);
  }
  /**
   * This is an internal method. If you just want to write a message
   * in binary format, use `toBinary()`.
   *
   * Serializes the message in binary format and appends it to the given
   * writer. Returns passed writer.
   */
  internalBinaryWrite(message, writer, options) {
    this.refBinWriter.write(message, writer, options);
    return writer;
  }
  /**
   * This is an internal method. If you just want to read a message from
   * binary data, use `fromBinary()`.
   *
   * Reads data from binary format and merges the fields into
   * the target according to protobuf rules. If the target is
   * omitted, a new instance is created first.
   */
  internalBinaryRead(reader, length, options, target) {
    let message = target !== null && target !== void 0 ? target : this.create();
    this.refBinReader.read(reader, message, options, length);
    return message;
  }
};

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/reflection-info.js
function normalizeMethodInfo(method, service) {
  var _a, _b, _c;
  let m = method;
  m.service = service;
  m.localName = (_a = m.localName) !== null && _a !== void 0 ? _a : lowerCamelCase(m.name);
  m.serverStreaming = !!m.serverStreaming;
  m.clientStreaming = !!m.clientStreaming;
  m.options = (_b = m.options) !== null && _b !== void 0 ? _b : {};
  m.idempotency = (_c = m.idempotency) !== null && _c !== void 0 ? _c : void 0;
  return m;
}

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/service-type.js
var ServiceType = class {
  constructor(typeName, methods, options) {
    this.typeName = typeName;
    this.methods = methods.map((i) => normalizeMethodInfo(i, this));
    this.options = options !== null && options !== void 0 ? options : {};
  }
};

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/rpc-error.js
var RpcError = class extends Error {
  constructor(message, code = "UNKNOWN", meta) {
    super(message);
    this.name = "RpcError";
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = code;
    this.meta = meta !== null && meta !== void 0 ? meta : {};
  }
  toString() {
    const l = [this.name + ": " + this.message];
    if (this.code) {
      l.push("");
      l.push("Code: " + this.code);
    }
    if (this.serviceName && this.methodName) {
      l.push("Method: " + this.serviceName + "/" + this.methodName);
    }
    let m = Object.entries(this.meta);
    if (m.length) {
      l.push("");
      l.push("Meta:");
      for (let [k, v] of m) {
        l.push(`  ${k}: ${v}`);
      }
    }
    return l.join("\n");
  }
};

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/rpc-options.js
function mergeRpcOptions(defaults, options) {
  if (!options)
    return defaults;
  let o = {};
  copy(defaults, o);
  copy(options, o);
  for (let key of Object.keys(options)) {
    let val = options[key];
    switch (key) {
      case "jsonOptions":
        o.jsonOptions = mergeJsonOptions(defaults.jsonOptions, o.jsonOptions);
        break;
      case "binaryOptions":
        o.binaryOptions = mergeBinaryOptions(defaults.binaryOptions, o.binaryOptions);
        break;
      case "meta":
        o.meta = {};
        copy(defaults.meta, o.meta);
        copy(options.meta, o.meta);
        break;
      case "interceptors":
        o.interceptors = defaults.interceptors ? defaults.interceptors.concat(val) : val.concat();
        break;
    }
  }
  return o;
}
function copy(a, into) {
  if (!a)
    return;
  let c = into;
  for (let [k, v] of Object.entries(a)) {
    if (v instanceof Date)
      c[k] = new Date(v.getTime());
    else if (Array.isArray(v))
      c[k] = v.concat();
    else
      c[k] = v;
  }
}

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/deferred.js
var DeferredState;
(function(DeferredState2) {
  DeferredState2[DeferredState2["PENDING"] = 0] = "PENDING";
  DeferredState2[DeferredState2["REJECTED"] = 1] = "REJECTED";
  DeferredState2[DeferredState2["RESOLVED"] = 2] = "RESOLVED";
})(DeferredState || (DeferredState = {}));
var Deferred = class {
  /**
   * @param preventUnhandledRejectionWarning - prevents the warning
   * "Unhandled Promise rejection" by adding a noop rejection handler.
   * Working with calls returned from the runtime-rpc package in an
   * async function usually means awaiting one call property after
   * the other. This means that the "status" is not being awaited when
   * an earlier await for the "headers" is rejected. This causes the
   * "unhandled promise reject" warning. A more correct behaviour for
   * calls might be to become aware whether at least one of the
   * promises is handled and swallow the rejection warning for the
   * others.
   */
  constructor(preventUnhandledRejectionWarning = true) {
    this._state = DeferredState.PENDING;
    this._promise = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
    if (preventUnhandledRejectionWarning) {
      this._promise.catch((_) => {
      });
    }
  }
  /**
   * Get the current state of the promise.
   */
  get state() {
    return this._state;
  }
  /**
   * Get the deferred promise.
   */
  get promise() {
    return this._promise;
  }
  /**
   * Resolve the promise. Throws if the promise is already resolved or rejected.
   */
  resolve(value) {
    if (this.state !== DeferredState.PENDING)
      throw new Error(`cannot resolve ${DeferredState[this.state].toLowerCase()}`);
    this._resolve(value);
    this._state = DeferredState.RESOLVED;
  }
  /**
   * Reject the promise. Throws if the promise is already resolved or rejected.
   */
  reject(reason) {
    if (this.state !== DeferredState.PENDING)
      throw new Error(`cannot reject ${DeferredState[this.state].toLowerCase()}`);
    this._reject(reason);
    this._state = DeferredState.REJECTED;
  }
  /**
   * Resolve the promise. Ignore if not pending.
   */
  resolvePending(val) {
    if (this._state === DeferredState.PENDING)
      this.resolve(val);
  }
  /**
   * Reject the promise. Ignore if not pending.
   */
  rejectPending(reason) {
    if (this._state === DeferredState.PENDING)
      this.reject(reason);
  }
};

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/rpc-output-stream.js
var RpcOutputStreamController = class {
  constructor() {
    this._lis = {
      nxt: [],
      msg: [],
      err: [],
      cmp: []
    };
    this._closed = false;
    this._itState = { q: [] };
  }
  // --- RpcOutputStream callback API
  onNext(callback) {
    return this.addLis(callback, this._lis.nxt);
  }
  onMessage(callback) {
    return this.addLis(callback, this._lis.msg);
  }
  onError(callback) {
    return this.addLis(callback, this._lis.err);
  }
  onComplete(callback) {
    return this.addLis(callback, this._lis.cmp);
  }
  addLis(callback, list) {
    list.push(callback);
    return () => {
      let i = list.indexOf(callback);
      if (i >= 0)
        list.splice(i, 1);
    };
  }
  // remove all listeners
  clearLis() {
    for (let l of Object.values(this._lis))
      l.splice(0, l.length);
  }
  // --- Controller API
  /**
   * Is this stream already closed by a completion or error?
   */
  get closed() {
    return this._closed !== false;
  }
  /**
   * Emit message, close with error, or close successfully, but only one
   * at a time.
   * Can be used to wrap a stream by using the other stream's `onNext`.
   */
  notifyNext(message, error, complete) {
    assert((message ? 1 : 0) + (error ? 1 : 0) + (complete ? 1 : 0) <= 1, "only one emission at a time");
    if (message)
      this.notifyMessage(message);
    if (error)
      this.notifyError(error);
    if (complete)
      this.notifyComplete();
  }
  /**
   * Emits a new message. Throws if stream is closed.
   *
   * Triggers onNext and onMessage callbacks.
   */
  notifyMessage(message) {
    assert(!this.closed, "stream is closed");
    this.pushIt({ value: message, done: false });
    this._lis.msg.forEach((l) => l(message));
    this._lis.nxt.forEach((l) => l(message, void 0, false));
  }
  /**
   * Closes the stream with an error. Throws if stream is closed.
   *
   * Triggers onNext and onError callbacks.
   */
  notifyError(error) {
    assert(!this.closed, "stream is closed");
    this._closed = error;
    this.pushIt(error);
    this._lis.err.forEach((l) => l(error));
    this._lis.nxt.forEach((l) => l(void 0, error, false));
    this.clearLis();
  }
  /**
   * Closes the stream successfully. Throws if stream is closed.
   *
   * Triggers onNext and onComplete callbacks.
   */
  notifyComplete() {
    assert(!this.closed, "stream is closed");
    this._closed = true;
    this.pushIt({ value: null, done: true });
    this._lis.cmp.forEach((l) => l());
    this._lis.nxt.forEach((l) => l(void 0, void 0, true));
    this.clearLis();
  }
  /**
   * Creates an async iterator (that can be used with `for await {...}`)
   * to consume the stream.
   *
   * Some things to note:
   * - If an error occurs, the `for await` will throw it.
   * - If an error occurred before the `for await` was started, `for await`
   *   will re-throw it.
   * - If the stream is already complete, the `for await` will be empty.
   * - If your `for await` consumes slower than the stream produces,
   *   for example because you are relaying messages in a slow operation,
   *   messages are queued.
   */
  [Symbol.asyncIterator]() {
    if (this._closed === true)
      this.pushIt({ value: null, done: true });
    else if (this._closed !== false)
      this.pushIt(this._closed);
    return {
      next: () => {
        let state = this._itState;
        assert(state, "bad state");
        assert(!state.p, "iterator contract broken");
        let first = state.q.shift();
        if (first)
          return "value" in first ? Promise.resolve(first) : Promise.reject(first);
        state.p = new Deferred();
        return state.p.promise;
      }
    };
  }
  // "push" a new iterator result.
  // this either resolves a pending promise, or enqueues the result.
  pushIt(result) {
    let state = this._itState;
    if (state.p) {
      const p = state.p;
      assert(p.state == DeferredState.PENDING, "iterator contract broken");
      "value" in result ? p.resolve(result) : p.reject(result);
      delete state.p;
    } else {
      state.q.push(result);
    }
  }
};

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/unary-call.js
var __awaiter = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var UnaryCall = class {
  constructor(method, requestHeaders, request, headers, response, status, trailers) {
    this.method = method;
    this.requestHeaders = requestHeaders;
    this.request = request;
    this.headers = headers;
    this.response = response;
    this.status = status;
    this.trailers = trailers;
  }
  /**
   * If you are only interested in the final outcome of this call,
   * you can await it to receive a `FinishedUnaryCall`.
   */
  then(onfulfilled, onrejected) {
    return this.promiseFinished().then((value) => onfulfilled ? Promise.resolve(onfulfilled(value)) : value, (reason) => onrejected ? Promise.resolve(onrejected(reason)) : Promise.reject(reason));
  }
  promiseFinished() {
    return __awaiter(this, void 0, void 0, function* () {
      let [headers, response, status, trailers] = yield Promise.all([this.headers, this.response, this.status, this.trailers]);
      return {
        method: this.method,
        requestHeaders: this.requestHeaders,
        request: this.request,
        headers,
        response,
        status,
        trailers
      };
    });
  }
};

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/server-streaming-call.js
var __awaiter2 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
var ServerStreamingCall = class {
  constructor(method, requestHeaders, request, headers, response, status, trailers) {
    this.method = method;
    this.requestHeaders = requestHeaders;
    this.request = request;
    this.headers = headers;
    this.responses = response;
    this.status = status;
    this.trailers = trailers;
  }
  /**
   * Instead of awaiting the response status and trailers, you can
   * just as well await this call itself to receive the server outcome.
   * You should first setup some listeners to the `request` to
   * see the actual messages the server replied with.
   */
  then(onfulfilled, onrejected) {
    return this.promiseFinished().then((value) => onfulfilled ? Promise.resolve(onfulfilled(value)) : value, (reason) => onrejected ? Promise.resolve(onrejected(reason)) : Promise.reject(reason));
  }
  promiseFinished() {
    return __awaiter2(this, void 0, void 0, function* () {
      let [headers, status, trailers] = yield Promise.all([this.headers, this.status, this.trailers]);
      return {
        method: this.method,
        requestHeaders: this.requestHeaders,
        request: this.request,
        headers,
        status,
        trailers
      };
    });
  }
};

// node_modules/@protobuf-ts/runtime-rpc/build/es2015/rpc-interceptor.js
function stackIntercept(kind, transport, method, options, input) {
  var _a, _b, _c, _d;
  if (kind == "unary") {
    let tail = (mtd, inp, opt) => transport.unary(mtd, inp, opt);
    for (const curr of ((_a = options.interceptors) !== null && _a !== void 0 ? _a : []).filter((i) => i.interceptUnary).reverse()) {
      const next = tail;
      tail = (mtd, inp, opt) => curr.interceptUnary(next, mtd, inp, opt);
    }
    return tail(method, input, options);
  }
  if (kind == "serverStreaming") {
    let tail = (mtd, inp, opt) => transport.serverStreaming(mtd, inp, opt);
    for (const curr of ((_b = options.interceptors) !== null && _b !== void 0 ? _b : []).filter((i) => i.interceptServerStreaming).reverse()) {
      const next = tail;
      tail = (mtd, inp, opt) => curr.interceptServerStreaming(next, mtd, inp, opt);
    }
    return tail(method, input, options);
  }
  if (kind == "clientStreaming") {
    let tail = (mtd, opt) => transport.clientStreaming(mtd, opt);
    for (const curr of ((_c = options.interceptors) !== null && _c !== void 0 ? _c : []).filter((i) => i.interceptClientStreaming).reverse()) {
      const next = tail;
      tail = (mtd, opt) => curr.interceptClientStreaming(next, mtd, opt);
    }
    return tail(method, options);
  }
  if (kind == "duplex") {
    let tail = (mtd, opt) => transport.duplex(mtd, opt);
    for (const curr of ((_d = options.interceptors) !== null && _d !== void 0 ? _d : []).filter((i) => i.interceptDuplex).reverse()) {
      const next = tail;
      tail = (mtd, opt) => curr.interceptDuplex(next, mtd, opt);
    }
    return tail(method, options);
  }
  assertNever(kind);
}

// node_modules/@protobuf-ts/grpcweb-transport/build/es2015/goog-grpc-status-code.js
var GrpcStatusCode;
(function(GrpcStatusCode2) {
  GrpcStatusCode2[GrpcStatusCode2["OK"] = 0] = "OK";
  GrpcStatusCode2[GrpcStatusCode2["CANCELLED"] = 1] = "CANCELLED";
  GrpcStatusCode2[GrpcStatusCode2["UNKNOWN"] = 2] = "UNKNOWN";
  GrpcStatusCode2[GrpcStatusCode2["INVALID_ARGUMENT"] = 3] = "INVALID_ARGUMENT";
  GrpcStatusCode2[GrpcStatusCode2["DEADLINE_EXCEEDED"] = 4] = "DEADLINE_EXCEEDED";
  GrpcStatusCode2[GrpcStatusCode2["NOT_FOUND"] = 5] = "NOT_FOUND";
  GrpcStatusCode2[GrpcStatusCode2["ALREADY_EXISTS"] = 6] = "ALREADY_EXISTS";
  GrpcStatusCode2[GrpcStatusCode2["PERMISSION_DENIED"] = 7] = "PERMISSION_DENIED";
  GrpcStatusCode2[GrpcStatusCode2["UNAUTHENTICATED"] = 16] = "UNAUTHENTICATED";
  GrpcStatusCode2[GrpcStatusCode2["RESOURCE_EXHAUSTED"] = 8] = "RESOURCE_EXHAUSTED";
  GrpcStatusCode2[GrpcStatusCode2["FAILED_PRECONDITION"] = 9] = "FAILED_PRECONDITION";
  GrpcStatusCode2[GrpcStatusCode2["ABORTED"] = 10] = "ABORTED";
  GrpcStatusCode2[GrpcStatusCode2["OUT_OF_RANGE"] = 11] = "OUT_OF_RANGE";
  GrpcStatusCode2[GrpcStatusCode2["UNIMPLEMENTED"] = 12] = "UNIMPLEMENTED";
  GrpcStatusCode2[GrpcStatusCode2["INTERNAL"] = 13] = "INTERNAL";
  GrpcStatusCode2[GrpcStatusCode2["UNAVAILABLE"] = 14] = "UNAVAILABLE";
  GrpcStatusCode2[GrpcStatusCode2["DATA_LOSS"] = 15] = "DATA_LOSS";
})(GrpcStatusCode || (GrpcStatusCode = {}));

// node_modules/@protobuf-ts/grpcweb-transport/build/es2015/grpc-web-format.js
var __awaiter3 = function(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
function createGrpcWebRequestHeader(headers, format, timeout, meta, userAgent) {
  if (meta) {
    for (let [k, v] of Object.entries(meta)) {
      if (typeof v == "string")
        headers.append(k, v);
      else
        for (let i of v)
          headers.append(k, i);
    }
  }
  headers.set("Content-Type", format === "text" ? "application/grpc-web-text" : "application/grpc-web+proto");
  if (format == "text") {
    headers.set("Accept", "application/grpc-web-text");
  }
  headers.set("X-Grpc-Web", "1");
  if (userAgent)
    headers.set("X-User-Agent", userAgent);
  if (typeof timeout === "number") {
    if (timeout <= 0) {
      throw new RpcError(`timeout ${timeout} ms exceeded`, GrpcStatusCode[GrpcStatusCode.DEADLINE_EXCEEDED]);
    }
    headers.set("grpc-timeout", `${timeout}m`);
  } else if (timeout) {
    const deadline = timeout.getTime();
    const now = Date.now();
    if (deadline <= now) {
      throw new RpcError(`deadline ${timeout} exceeded`, GrpcStatusCode[GrpcStatusCode.DEADLINE_EXCEEDED]);
    }
    headers.set("grpc-timeout", `${deadline - now}m`);
  }
  return headers;
}
function createGrpcWebRequestBody(message, format) {
  let body = new Uint8Array(5 + message.length);
  body[0] = GrpcWebFrame.DATA;
  for (let msgLen = message.length, i = 4; i > 0; i--) {
    body[i] = msgLen % 256;
    msgLen >>>= 8;
  }
  body.set(message, 5);
  return format === "binary" ? body : base64encode(body);
}
function readGrpcWebResponseHeader(headersOrFetchResponse, httpStatus, httpStatusText) {
  if (arguments.length === 1) {
    let fetchResponse = headersOrFetchResponse;
    let responseType;
    try {
      responseType = fetchResponse.type;
    } catch (_a) {
    }
    switch (responseType) {
      case "error":
      case "opaque":
      case "opaqueredirect":
        throw new RpcError(`fetch response type ${fetchResponse.type}`, GrpcStatusCode[GrpcStatusCode.UNKNOWN]);
    }
    return readGrpcWebResponseHeader(fetchHeadersToHttp(fetchResponse.headers), fetchResponse.status, fetchResponse.statusText);
  }
  let headers = headersOrFetchResponse, httpOk = httpStatus >= 200 && httpStatus < 300, responseMeta = parseMetadata(headers), [statusCode, statusDetail] = parseStatus(headers);
  if ((statusCode === void 0 || statusCode === GrpcStatusCode.OK) && !httpOk) {
    statusCode = httpStatusToGrpc(httpStatus);
    statusDetail = httpStatusText;
  }
  return [statusCode, statusDetail, responseMeta];
}
function readGrpcWebResponseTrailer(data) {
  let headers = parseTrailer(data), [code, detail] = parseStatus(headers), meta = parseMetadata(headers);
  return [code !== null && code !== void 0 ? code : GrpcStatusCode.OK, detail, meta];
}
var GrpcWebFrame;
(function(GrpcWebFrame2) {
  GrpcWebFrame2[GrpcWebFrame2["DATA"] = 0] = "DATA";
  GrpcWebFrame2[GrpcWebFrame2["TRAILER"] = 128] = "TRAILER";
})(GrpcWebFrame || (GrpcWebFrame = {}));
function readGrpcWebResponseBody(stream, contentType, onFrame) {
  return __awaiter3(this, void 0, void 0, function* () {
    let streamReader, base64queue = "", byteQueue = new Uint8Array(0), format = parseFormat(contentType);
    if (isReadableStream(stream)) {
      let whatWgReadableStream = stream.getReader();
      streamReader = {
        next: () => whatWgReadableStream.read()
      };
    } else {
      streamReader = stream[Symbol.asyncIterator]();
    }
    while (true) {
      let result = yield streamReader.next();
      if (result.value !== void 0) {
        if (format === "text") {
          for (let i = 0; i < result.value.length; i++)
            base64queue += String.fromCharCode(result.value[i]);
          let safeLen = base64queue.length - base64queue.length % 4;
          if (safeLen === 0)
            continue;
          byteQueue = concatBytes(byteQueue, base64decode(base64queue.substring(0, safeLen)));
          base64queue = base64queue.substring(safeLen);
        } else {
          byteQueue = concatBytes(byteQueue, result.value);
        }
        while (byteQueue.length >= 5 && byteQueue[0] === GrpcWebFrame.DATA) {
          let msgLen = 0;
          for (let i = 1; i < 5; i++)
            msgLen = (msgLen << 8) + byteQueue[i];
          if (byteQueue.length - 5 >= msgLen) {
            onFrame(GrpcWebFrame.DATA, byteQueue.subarray(5, 5 + msgLen));
            byteQueue = byteQueue.subarray(5 + msgLen);
          } else
            break;
        }
      }
      if (result.done) {
        if (byteQueue.length === 0)
          break;
        if (byteQueue[0] !== GrpcWebFrame.TRAILER || byteQueue.length < 5)
          throw new RpcError("premature EOF", GrpcStatusCode[GrpcStatusCode.DATA_LOSS]);
        onFrame(GrpcWebFrame.TRAILER, byteQueue.subarray(5));
        break;
      }
    }
  });
}
var isReadableStream = (s) => {
  return typeof s.getReader == "function";
};
function concatBytes(a, b) {
  let n = new Uint8Array(a.length + b.length);
  n.set(a);
  n.set(b, a.length);
  return n;
}
function parseFormat(contentType) {
  switch (contentType) {
    case "application/grpc-web-text":
    case "application/grpc-web-text+proto":
      return "text";
    case "application/grpc-web":
    case "application/grpc-web+proto":
      return "binary";
    case void 0:
    case null:
      throw new RpcError("missing response content type", GrpcStatusCode[GrpcStatusCode.INTERNAL]);
    default:
      throw new RpcError("unexpected response content type: " + contentType, GrpcStatusCode[GrpcStatusCode.INTERNAL]);
  }
}
function parseStatus(headers) {
  let code, message;
  let m = headers["grpc-message"];
  if (m !== void 0) {
    if (Array.isArray(m))
      return [GrpcStatusCode.INTERNAL, "invalid grpc-web message"];
    message = m;
  }
  let s = headers["grpc-status"];
  if (s !== void 0) {
    if (Array.isArray(s))
      return [GrpcStatusCode.INTERNAL, "invalid grpc-web status"];
    code = parseInt(s, 10);
    if (GrpcStatusCode[code] === void 0)
      return [GrpcStatusCode.INTERNAL, "invalid grpc-web status"];
  }
  return [code, message];
}
function parseMetadata(headers) {
  let meta = {};
  for (let [k, v] of Object.entries(headers))
    switch (k) {
      case "grpc-message":
      case "grpc-status":
      case "content-type":
        break;
      default:
        meta[k] = v;
    }
  return meta;
}
function parseTrailer(trailerData) {
  let headers = {};
  for (let chunk of String.fromCharCode.apply(String, trailerData).trim().split("\r\n")) {
    if (chunk == "")
      continue;
    let [key, ...val] = chunk.split(":");
    const value = val.join(":").trim();
    key = key.trim();
    let e = headers[key];
    if (typeof e == "string")
      headers[key] = [e, value];
    else if (Array.isArray(e))
      e.push(value);
    else
      headers[key] = value;
  }
  return headers;
}
function fetchHeadersToHttp(fetchHeaders) {
  let headers = {};
  fetchHeaders.forEach((value, key) => {
    let e = headers[key];
    if (typeof e == "string")
      headers[key] = [e, value];
    else if (Array.isArray(e))
      e.push(value);
    else
      headers[key] = value;
  });
  return headers;
}
function httpStatusToGrpc(httpStatus) {
  switch (httpStatus) {
    case 200:
      return GrpcStatusCode.OK;
    case 400:
      return GrpcStatusCode.INVALID_ARGUMENT;
    case 401:
      return GrpcStatusCode.UNAUTHENTICATED;
    case 403:
      return GrpcStatusCode.PERMISSION_DENIED;
    case 404:
      return GrpcStatusCode.NOT_FOUND;
    case 409:
      return GrpcStatusCode.ABORTED;
    case 412:
      return GrpcStatusCode.FAILED_PRECONDITION;
    case 429:
      return GrpcStatusCode.RESOURCE_EXHAUSTED;
    case 499:
      return GrpcStatusCode.CANCELLED;
    case 500:
      return GrpcStatusCode.UNKNOWN;
    case 501:
      return GrpcStatusCode.UNIMPLEMENTED;
    case 503:
      return GrpcStatusCode.UNAVAILABLE;
    case 504:
      return GrpcStatusCode.DEADLINE_EXCEEDED;
    default:
      return GrpcStatusCode.UNKNOWN;
  }
}

// node_modules/@protobuf-ts/grpcweb-transport/build/es2015/grpc-web-transport.js
var GrpcWebFetchTransport = class {
  constructor(defaultOptions) {
    this.defaultOptions = defaultOptions;
  }
  mergeOptions(options) {
    return mergeRpcOptions(this.defaultOptions, options);
  }
  /**
   * Create an URI for a gRPC web call.
   *
   * Takes the `baseUrl` option and appends:
   * - slash "/"
   * - package name
   * - dot "."
   * - service name
   * - slash "/"
   * - method name
   *
   * If the service was declared without a package, the package name and dot
   * are omitted.
   *
   * All names are used exactly like declared in .proto.
   */
  makeUrl(method, options) {
    let base = options.baseUrl;
    if (base.endsWith("/"))
      base = base.substring(0, base.length - 1);
    return `${base}/${method.service.typeName}/${method.name}`;
  }
  clientStreaming(method) {
    const e = new RpcError("Client streaming is not supported by grpc-web", GrpcStatusCode[GrpcStatusCode.UNIMPLEMENTED]);
    e.methodName = method.name;
    e.serviceName = method.service.typeName;
    throw e;
  }
  duplex(method) {
    const e = new RpcError("Duplex streaming is not supported by grpc-web", GrpcStatusCode[GrpcStatusCode.UNIMPLEMENTED]);
    e.methodName = method.name;
    e.serviceName = method.service.typeName;
    throw e;
  }
  serverStreaming(method, input, options) {
    var _a, _b, _c, _d, _e;
    let opt = options, format = (_a = opt.format) !== null && _a !== void 0 ? _a : "text", fetch = (_b = opt.fetch) !== null && _b !== void 0 ? _b : globalThis.fetch, fetchInit = (_c = opt.fetchInit) !== null && _c !== void 0 ? _c : {}, url = this.makeUrl(method, opt), inputBytes = method.I.toBinary(input, opt.binaryOptions), defHeader = new Deferred(), responseStream = new RpcOutputStreamController(), responseEmptyBody = true, maybeStatus, defStatus = new Deferred(), maybeTrailer, defTrailer = new Deferred();
    fetch(url, Object.assign(Object.assign({}, fetchInit), {
      method: "POST",
      headers: createGrpcWebRequestHeader(new globalThis.Headers(), format, opt.timeout, opt.meta),
      body: createGrpcWebRequestBody(inputBytes, format),
      signal: (_d = options.abort) !== null && _d !== void 0 ? _d : null
      // node-fetch@3.0.0-beta.9 rejects `undefined`
    })).then((fetchResponse) => {
      let [code, detail, meta] = readGrpcWebResponseHeader(fetchResponse);
      defHeader.resolve(meta);
      if (code != null && code !== GrpcStatusCode.OK)
        throw new RpcError(detail !== null && detail !== void 0 ? detail : GrpcStatusCode[code], GrpcStatusCode[code], meta);
      if (code != null)
        maybeStatus = {
          code: GrpcStatusCode[code],
          detail: detail !== null && detail !== void 0 ? detail : GrpcStatusCode[code]
        };
      return fetchResponse;
    }).then((fetchResponse) => {
      if (!fetchResponse.body)
        throw new RpcError("missing response body", GrpcStatusCode[GrpcStatusCode.INTERNAL]);
      return readGrpcWebResponseBody(fetchResponse.body, fetchResponse.headers.get("content-type"), (type, data) => {
        switch (type) {
          case GrpcWebFrame.DATA:
            responseStream.notifyMessage(method.O.fromBinary(data, opt.binaryOptions));
            responseEmptyBody = false;
            break;
          case GrpcWebFrame.TRAILER:
            let code, detail;
            [code, detail, maybeTrailer] = readGrpcWebResponseTrailer(data);
            maybeStatus = {
              code: GrpcStatusCode[code],
              detail: detail !== null && detail !== void 0 ? detail : GrpcStatusCode[code]
            };
            break;
        }
      });
    }).then(() => {
      if (!maybeTrailer && !responseEmptyBody)
        throw new RpcError(`missing trailers`, GrpcStatusCode[GrpcStatusCode.DATA_LOSS]);
      if (!maybeStatus)
        throw new RpcError(`missing status`, GrpcStatusCode[GrpcStatusCode.INTERNAL]);
      if (maybeStatus.code !== "OK")
        throw new RpcError(maybeStatus.detail, maybeStatus.code, maybeTrailer);
      responseStream.notifyComplete();
      defStatus.resolve(maybeStatus);
      defTrailer.resolve(maybeTrailer || {});
    }).catch((reason) => {
      let error;
      if (reason instanceof RpcError)
        error = reason;
      else if (reason instanceof Error && reason.name === "AbortError")
        error = new RpcError(reason.message, GrpcStatusCode[GrpcStatusCode.CANCELLED]);
      else
        error = new RpcError(reason instanceof Error ? reason.message : "" + reason, GrpcStatusCode[GrpcStatusCode.INTERNAL]);
      error.methodName = method.name;
      error.serviceName = method.service.typeName;
      defHeader.rejectPending(error);
      responseStream.notifyError(error);
      defStatus.rejectPending(error);
      defTrailer.rejectPending(error);
    });
    return new ServerStreamingCall(method, (_e = opt.meta) !== null && _e !== void 0 ? _e : {}, input, defHeader.promise, responseStream, defStatus.promise, defTrailer.promise);
  }
  unary(method, input, options) {
    var _a, _b, _c, _d, _e;
    let opt = options, format = (_a = opt.format) !== null && _a !== void 0 ? _a : "text", fetch = (_b = opt.fetch) !== null && _b !== void 0 ? _b : globalThis.fetch, fetchInit = (_c = opt.fetchInit) !== null && _c !== void 0 ? _c : {}, url = this.makeUrl(method, opt), inputBytes = method.I.toBinary(input, opt.binaryOptions), defHeader = new Deferred(), maybeMessage, defMessage = new Deferred(), maybeStatus, defStatus = new Deferred(), maybeTrailer, defTrailer = new Deferred();
    fetch(url, Object.assign(Object.assign({}, fetchInit), {
      method: "POST",
      headers: createGrpcWebRequestHeader(new globalThis.Headers(), format, opt.timeout, opt.meta),
      body: createGrpcWebRequestBody(inputBytes, format),
      signal: (_d = options.abort) !== null && _d !== void 0 ? _d : null
      // node-fetch@3.0.0-beta.9 rejects `undefined`
    })).then((fetchResponse) => {
      let [code, detail, meta] = readGrpcWebResponseHeader(fetchResponse);
      defHeader.resolve(meta);
      if (code != null && code !== GrpcStatusCode.OK)
        throw new RpcError(detail !== null && detail !== void 0 ? detail : GrpcStatusCode[code], GrpcStatusCode[code], meta);
      if (code != null)
        maybeStatus = {
          code: GrpcStatusCode[code],
          detail: detail !== null && detail !== void 0 ? detail : GrpcStatusCode[code]
        };
      return fetchResponse;
    }).then((fetchResponse) => {
      if (!fetchResponse.body)
        throw new RpcError("missing response body", GrpcStatusCode[GrpcStatusCode.INTERNAL]);
      return readGrpcWebResponseBody(fetchResponse.body, fetchResponse.headers.get("content-type"), (type, data) => {
        switch (type) {
          case GrpcWebFrame.DATA:
            if (maybeMessage)
              throw new RpcError(`unary call received 2nd message`, GrpcStatusCode[GrpcStatusCode.DATA_LOSS]);
            maybeMessage = method.O.fromBinary(data, opt.binaryOptions);
            break;
          case GrpcWebFrame.TRAILER:
            let code, detail;
            [code, detail, maybeTrailer] = readGrpcWebResponseTrailer(data);
            maybeStatus = {
              code: GrpcStatusCode[code],
              detail: detail !== null && detail !== void 0 ? detail : GrpcStatusCode[code]
            };
            break;
        }
      });
    }).then(() => {
      if (!maybeTrailer && maybeMessage)
        throw new RpcError(`missing trailers`, GrpcStatusCode[GrpcStatusCode.DATA_LOSS]);
      if (!maybeStatus)
        throw new RpcError(`missing status`, GrpcStatusCode[GrpcStatusCode.INTERNAL]);
      if (!maybeMessage && maybeStatus.code === "OK")
        throw new RpcError("expected error status", GrpcStatusCode[GrpcStatusCode.DATA_LOSS]);
      if (!maybeMessage)
        throw new RpcError(maybeStatus.detail, maybeStatus.code, maybeTrailer);
      defMessage.resolve(maybeMessage);
      if (maybeStatus.code !== "OK")
        throw new RpcError(maybeStatus.detail, maybeStatus.code, maybeTrailer);
      defStatus.resolve(maybeStatus);
      defTrailer.resolve(maybeTrailer || {});
    }).catch((reason) => {
      let error;
      if (reason instanceof RpcError)
        error = reason;
      else if (reason instanceof Error && reason.name === "AbortError")
        error = new RpcError(reason.message, GrpcStatusCode[GrpcStatusCode.CANCELLED]);
      else
        error = new RpcError(reason instanceof Error ? reason.message : "" + reason, GrpcStatusCode[GrpcStatusCode.INTERNAL]);
      error.methodName = method.name;
      error.serviceName = method.service.typeName;
      defHeader.rejectPending(error);
      defMessage.rejectPending(error);
      defStatus.rejectPending(error);
      defTrailer.rejectPending(error);
    });
    return new UnaryCall(method, (_e = opt.meta) !== null && _e !== void 0 ? _e : {}, input, defHeader.promise, defMessage.promise, defStatus.promise, defTrailer.promise);
  }
};

// gen/nvidia_ace.status.v1.ts
var Status_Code = /* @__PURE__ */ ((Status_Code2) => {
  Status_Code2[Status_Code2["SUCCESS"] = 0] = "SUCCESS";
  Status_Code2[Status_Code2["INFO"] = 1] = "INFO";
  Status_Code2[Status_Code2["WARNING"] = 2] = "WARNING";
  Status_Code2[Status_Code2["ERROR"] = 3] = "ERROR";
  return Status_Code2;
})(Status_Code || {});
var Status$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.status.v1.Status", [
      { no: 1, name: "code", kind: "enum", T: () => ["nvidia_ace.status.v1.Status.Code", Status_Code] },
      {
        no: 2,
        name: "message",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.code = 0;
    message.message = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.status.v1.Status.Code code */
        1:
          message.code = reader.int32();
          break;
        case /* string message */
        2:
          message.message = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.code !== 0)
      writer.tag(1, WireType.Varint).int32(message.code);
    if (message.message !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.message);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var Status = new Status$Type();

// gen/google/protobuf/any.ts
var Any$Type = class extends MessageType {
  constructor() {
    super("google.protobuf.Any", [
      {
        no: 1,
        name: "type_url",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "value",
        kind: "scalar",
        T: 12
        /*ScalarType.BYTES*/
      }
    ]);
  }
  /**
   * Pack the message into a new `Any`.
   *
   * Uses 'type.googleapis.com/full.type.name' as the type URL.
   */
  pack(message, type) {
    return {
      typeUrl: this.typeNameToUrl(type.typeName),
      value: type.toBinary(message)
    };
  }
  /**
   * Unpack the message from the `Any`.
   */
  unpack(any, type, options) {
    if (!this.contains(any, type))
      throw new Error("Cannot unpack google.protobuf.Any with typeUrl '" + any.typeUrl + "' as " + type.typeName + ".");
    return type.fromBinary(any.value, options);
  }
  /**
   * Does the given `Any` contain a packed message of the given type?
   */
  contains(any, type) {
    if (!any.typeUrl.length)
      return false;
    let wants = typeof type == "string" ? type : type.typeName;
    let has = this.typeUrlToName(any.typeUrl);
    return wants === has;
  }
  /**
   * Convert the message to canonical JSON value.
   *
   * You have to provide the `typeRegistry` option so that the
   * packed message can be converted to JSON.
   *
   * The `typeRegistry` option is also required to read
   * `google.protobuf.Any` from JSON format.
   */
  internalJsonWrite(any, options) {
    if (any.typeUrl === "")
      return {};
    let typeName = this.typeUrlToName(any.typeUrl);
    let opt = jsonWriteOptions(options);
    let type = opt.typeRegistry?.find((t) => t.typeName === typeName);
    if (!type)
      throw new globalThis.Error("Unable to convert google.protobuf.Any with typeUrl '" + any.typeUrl + "' to JSON. The specified type " + typeName + " is not available in the type registry.");
    let value = type.fromBinary(any.value, { readUnknownField: false });
    let json = type.internalJsonWrite(value, opt);
    if (typeName.startsWith("google.protobuf.") || !isJsonObject(json))
      json = { value: json };
    json["@type"] = any.typeUrl;
    return json;
  }
  internalJsonRead(json, options, target) {
    if (!isJsonObject(json))
      throw new globalThis.Error("Unable to parse google.protobuf.Any from JSON " + typeofJsonValue(json) + ".");
    if (typeof json["@type"] != "string" || json["@type"] == "")
      return this.create();
    let typeName = this.typeUrlToName(json["@type"]);
    let type = options?.typeRegistry?.find((t) => t.typeName == typeName);
    if (!type)
      throw new globalThis.Error("Unable to parse google.protobuf.Any from JSON. The specified type " + typeName + " is not available in the type registry.");
    let value;
    if (typeName.startsWith("google.protobuf.") && json.hasOwnProperty("value"))
      value = type.fromJson(json["value"], options);
    else {
      let copy2 = Object.assign({}, json);
      delete copy2["@type"];
      value = type.fromJson(copy2, options);
    }
    if (target === void 0)
      target = this.create();
    target.typeUrl = json["@type"];
    target.value = type.toBinary(value);
    return target;
  }
  typeNameToUrl(name) {
    if (!name.length)
      throw new Error("invalid type name: " + name);
    return "type.googleapis.com/" + name;
  }
  typeUrlToName(url) {
    if (!url.length)
      throw new Error("invalid type url: " + url);
    let slash = url.lastIndexOf("/");
    let name = slash > 0 ? url.substring(slash + 1) : url;
    if (!name.length)
      throw new Error("invalid type url: " + url);
    return name;
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.typeUrl = "";
    message.value = new Uint8Array(0);
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string type_url */
        1:
          message.typeUrl = reader.string();
          break;
        case /* bytes value */
        2:
          message.value = reader.bytes();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.typeUrl !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.typeUrl);
    if (message.value.length)
      writer.tag(2, WireType.LengthDelimited).bytes(message.value);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var Any = new Any$Type();

// gen/nvidia_ace.audio.v1.ts
var AudioHeader_AudioFormat = /* @__PURE__ */ ((AudioHeader_AudioFormat2) => {
  AudioHeader_AudioFormat2[AudioHeader_AudioFormat2["PCM"] = 0] = "PCM";
  return AudioHeader_AudioFormat2;
})(AudioHeader_AudioFormat || {});
var AudioHeader$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.audio.v1.AudioHeader", [
      { no: 1, name: "audio_format", kind: "enum", T: () => ["nvidia_ace.audio.v1.AudioHeader.AudioFormat", AudioHeader_AudioFormat, "AUDIO_FORMAT_"] },
      {
        no: 2,
        name: "channel_count",
        kind: "scalar",
        T: 13
        /*ScalarType.UINT32*/
      },
      {
        no: 3,
        name: "samples_per_second",
        kind: "scalar",
        T: 13
        /*ScalarType.UINT32*/
      },
      {
        no: 4,
        name: "bits_per_sample",
        kind: "scalar",
        T: 13
        /*ScalarType.UINT32*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.audioFormat = 0;
    message.channelCount = 0;
    message.samplesPerSecond = 0;
    message.bitsPerSample = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.audio.v1.AudioHeader.AudioFormat audio_format */
        1:
          message.audioFormat = reader.int32();
          break;
        case /* uint32 channel_count */
        2:
          message.channelCount = reader.uint32();
          break;
        case /* uint32 samples_per_second */
        3:
          message.samplesPerSecond = reader.uint32();
          break;
        case /* uint32 bits_per_sample */
        4:
          message.bitsPerSample = reader.uint32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.audioFormat !== 0)
      writer.tag(1, WireType.Varint).int32(message.audioFormat);
    if (message.channelCount !== 0)
      writer.tag(2, WireType.Varint).uint32(message.channelCount);
    if (message.samplesPerSecond !== 0)
      writer.tag(3, WireType.Varint).uint32(message.samplesPerSecond);
    if (message.bitsPerSample !== 0)
      writer.tag(4, WireType.Varint).uint32(message.bitsPerSample);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AudioHeader = new AudioHeader$Type();

// gen/nvidia_ace.animation_id.v1.ts
var AnimationIds$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_id.v1.AnimationIds", [
      {
        no: 1,
        name: "request_id",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "stream_id",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 3,
        name: "target_object_id",
        kind: "scalar",
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.requestId = "";
    message.streamId = "";
    message.targetObjectId = "";
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* string request_id */
        1:
          message.requestId = reader.string();
          break;
        case /* string stream_id */
        2:
          message.streamId = reader.string();
          break;
        case /* string target_object_id */
        3:
          message.targetObjectId = reader.string();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.requestId !== "")
      writer.tag(1, WireType.LengthDelimited).string(message.requestId);
    if (message.streamId !== "")
      writer.tag(2, WireType.LengthDelimited).string(message.streamId);
    if (message.targetObjectId !== "")
      writer.tag(3, WireType.LengthDelimited).string(message.targetObjectId);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AnimationIds = new AnimationIds$Type();

// gen/nvidia_ace.animation_data.v1.ts
var AnimationDataStreamHeader$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.AnimationDataStreamHeader", [
      { no: 1, name: "animation_ids", kind: "message", T: () => AnimationIds },
      {
        no: 2,
        name: "source_service_id",
        kind: "scalar",
        opt: true,
        T: 9
        /*ScalarType.STRING*/
      },
      { no: 3, name: "audio_header", kind: "message", T: () => AudioHeader },
      { no: 4, name: "skel_animation_header", kind: "message", T: () => SkelAnimationHeader },
      {
        no: 5,
        name: "start_time_code_since_epoch",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.startTimeCodeSinceEpoch = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.animation_id.v1.AnimationIds animation_ids */
        1:
          message.animationIds = AnimationIds.internalBinaryRead(reader, reader.uint32(), options, message.animationIds);
          break;
        case /* optional string source_service_id */
        2:
          message.sourceServiceId = reader.string();
          break;
        case /* optional nvidia_ace.audio.v1.AudioHeader audio_header */
        3:
          message.audioHeader = AudioHeader.internalBinaryRead(reader, reader.uint32(), options, message.audioHeader);
          break;
        case /* optional nvidia_ace.animation_data.v1.SkelAnimationHeader skel_animation_header */
        4:
          message.skelAnimationHeader = SkelAnimationHeader.internalBinaryRead(reader, reader.uint32(), options, message.skelAnimationHeader);
          break;
        case /* double start_time_code_since_epoch */
        5:
          message.startTimeCodeSinceEpoch = reader.double();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.animationIds)
      AnimationIds.internalBinaryWrite(message.animationIds, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.sourceServiceId !== void 0)
      writer.tag(2, WireType.LengthDelimited).string(message.sourceServiceId);
    if (message.audioHeader)
      AudioHeader.internalBinaryWrite(message.audioHeader, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    if (message.skelAnimationHeader)
      SkelAnimationHeader.internalBinaryWrite(message.skelAnimationHeader, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
    if (message.startTimeCodeSinceEpoch !== 0)
      writer.tag(5, WireType.Bit64).double(message.startTimeCodeSinceEpoch);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AnimationDataStreamHeader = new AnimationDataStreamHeader$Type();
var AnimationDataStream$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.AnimationDataStream", [
      { no: 1, name: "animation_data_stream_header", kind: "message", oneof: "streamPart", T: () => AnimationDataStreamHeader },
      { no: 2, name: "animation_data", kind: "message", oneof: "streamPart", T: () => AnimationData },
      { no: 3, name: "status", kind: "message", oneof: "streamPart", T: () => Status }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.streamPart = { oneofKind: void 0 };
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.animation_data.v1.AnimationDataStreamHeader animation_data_stream_header */
        1:
          message.streamPart = {
            oneofKind: "animationDataStreamHeader",
            animationDataStreamHeader: AnimationDataStreamHeader.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.animationDataStreamHeader)
          };
          break;
        case /* nvidia_ace.animation_data.v1.AnimationData animation_data */
        2:
          message.streamPart = {
            oneofKind: "animationData",
            animationData: AnimationData.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.animationData)
          };
          break;
        case /* nvidia_ace.status.v1.Status status */
        3:
          message.streamPart = {
            oneofKind: "status",
            status: Status.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.status)
          };
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.streamPart.oneofKind === "animationDataStreamHeader")
      AnimationDataStreamHeader.internalBinaryWrite(message.streamPart.animationDataStreamHeader, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.streamPart.oneofKind === "animationData")
      AnimationData.internalBinaryWrite(message.streamPart.animationData, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.streamPart.oneofKind === "status")
      Status.internalBinaryWrite(message.streamPart.status, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AnimationDataStream = new AnimationDataStream$Type();
var AnimationData$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.AnimationData", [
      { no: 1, name: "skel_animation", kind: "message", T: () => SkelAnimation },
      { no: 2, name: "audio", kind: "message", T: () => AudioWithTimeCode },
      { no: 3, name: "camera", kind: "message", T: () => Camera },
      { no: 4, name: "metadata", kind: "map", K: 9, V: { kind: "message", T: () => Any } }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.metadata = {};
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* optional nvidia_ace.animation_data.v1.SkelAnimation skel_animation */
        1:
          message.skelAnimation = SkelAnimation.internalBinaryRead(reader, reader.uint32(), options, message.skelAnimation);
          break;
        case /* optional nvidia_ace.animation_data.v1.AudioWithTimeCode audio */
        2:
          message.audio = AudioWithTimeCode.internalBinaryRead(reader, reader.uint32(), options, message.audio);
          break;
        case /* optional nvidia_ace.animation_data.v1.Camera camera */
        3:
          message.camera = Camera.internalBinaryRead(reader, reader.uint32(), options, message.camera);
          break;
        case /* map<string, google.protobuf.Any> metadata */
        4:
          this.binaryReadMap4(message.metadata, reader, options);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  binaryReadMap4(map, reader, options) {
    let len = reader.uint32(), end = reader.pos + len, key, val;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          key = reader.string();
          break;
        case 2:
          val = Any.internalBinaryRead(reader, reader.uint32(), options);
          break;
        default:
          throw new globalThis.Error("unknown map entry field for nvidia_ace.animation_data.v1.AnimationData.metadata");
      }
    }
    map[key ?? ""] = val ?? Any.create();
  }
  internalBinaryWrite(message, writer, options) {
    if (message.skelAnimation)
      SkelAnimation.internalBinaryWrite(message.skelAnimation, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.audio)
      AudioWithTimeCode.internalBinaryWrite(message.audio, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.camera)
      Camera.internalBinaryWrite(message.camera, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    for (let k of globalThis.Object.keys(message.metadata)) {
      writer.tag(4, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k);
      writer.tag(2, WireType.LengthDelimited).fork();
      Any.internalBinaryWrite(message.metadata[k], writer, options);
      writer.join().join();
    }
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AnimationData = new AnimationData$Type();
var AudioWithTimeCode$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.AudioWithTimeCode", [
      {
        no: 1,
        name: "time_code",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      },
      {
        no: 2,
        name: "audio_buffer",
        kind: "scalar",
        T: 12
        /*ScalarType.BYTES*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.timeCode = 0;
    message.audioBuffer = new Uint8Array(0);
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* double time_code */
        1:
          message.timeCode = reader.double();
          break;
        case /* bytes audio_buffer */
        2:
          message.audioBuffer = reader.bytes();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.timeCode !== 0)
      writer.tag(1, WireType.Bit64).double(message.timeCode);
    if (message.audioBuffer.length)
      writer.tag(2, WireType.LengthDelimited).bytes(message.audioBuffer);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AudioWithTimeCode = new AudioWithTimeCode$Type();
var SkelAnimationHeader$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.SkelAnimationHeader", [
      {
        no: 1,
        name: "blend_shapes",
        kind: "scalar",
        repeat: 2,
        T: 9
        /*ScalarType.STRING*/
      },
      {
        no: 2,
        name: "joints",
        kind: "scalar",
        repeat: 2,
        T: 9
        /*ScalarType.STRING*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.blendShapes = [];
    message.joints = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated string blend_shapes */
        1:
          message.blendShapes.push(reader.string());
          break;
        case /* repeated string joints */
        2:
          message.joints.push(reader.string());
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    for (let i = 0; i < message.blendShapes.length; i++)
      writer.tag(1, WireType.LengthDelimited).string(message.blendShapes[i]);
    for (let i = 0; i < message.joints.length; i++)
      writer.tag(2, WireType.LengthDelimited).string(message.joints[i]);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var SkelAnimationHeader = new SkelAnimationHeader$Type();
var SkelAnimation$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.SkelAnimation", [
      { no: 1, name: "blend_shape_weights", kind: "message", repeat: 2, T: () => FloatArrayWithTimeCode },
      { no: 2, name: "translations", kind: "message", repeat: 2, T: () => Float3ArrayWithTimeCode },
      { no: 3, name: "rotations", kind: "message", repeat: 2, T: () => QuatFArrayWithTimeCode },
      { no: 4, name: "scales", kind: "message", repeat: 2, T: () => Float3ArrayWithTimeCode }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.blendShapeWeights = [];
    message.translations = [];
    message.rotations = [];
    message.scales = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated nvidia_ace.animation_data.v1.FloatArrayWithTimeCode blend_shape_weights */
        1:
          message.blendShapeWeights.push(FloatArrayWithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        case /* repeated nvidia_ace.animation_data.v1.Float3ArrayWithTimeCode translations */
        2:
          message.translations.push(Float3ArrayWithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        case /* repeated nvidia_ace.animation_data.v1.QuatFArrayWithTimeCode rotations */
        3:
          message.rotations.push(QuatFArrayWithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        case /* repeated nvidia_ace.animation_data.v1.Float3ArrayWithTimeCode scales */
        4:
          message.scales.push(Float3ArrayWithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    for (let i = 0; i < message.blendShapeWeights.length; i++)
      FloatArrayWithTimeCode.internalBinaryWrite(message.blendShapeWeights[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    for (let i = 0; i < message.translations.length; i++)
      Float3ArrayWithTimeCode.internalBinaryWrite(message.translations[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    for (let i = 0; i < message.rotations.length; i++)
      QuatFArrayWithTimeCode.internalBinaryWrite(message.rotations[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    for (let i = 0; i < message.scales.length; i++)
      Float3ArrayWithTimeCode.internalBinaryWrite(message.scales[i], writer.tag(4, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var SkelAnimation = new SkelAnimation$Type();
var Camera$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.Camera", [
      { no: 1, name: "position", kind: "message", repeat: 2, T: () => Float3WithTimeCode },
      { no: 2, name: "rotation", kind: "message", repeat: 2, T: () => QuatFWithTimeCode },
      { no: 3, name: "focal_length", kind: "message", repeat: 2, T: () => FloatWithTimeCode },
      { no: 4, name: "focus_distance", kind: "message", repeat: 2, T: () => FloatWithTimeCode }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.position = [];
    message.rotation = [];
    message.focalLength = [];
    message.focusDistance = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated nvidia_ace.animation_data.v1.Float3WithTimeCode position */
        1:
          message.position.push(Float3WithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        case /* repeated nvidia_ace.animation_data.v1.QuatFWithTimeCode rotation */
        2:
          message.rotation.push(QuatFWithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        case /* repeated nvidia_ace.animation_data.v1.FloatWithTimeCode focal_length */
        3:
          message.focalLength.push(FloatWithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        case /* repeated nvidia_ace.animation_data.v1.FloatWithTimeCode focus_distance */
        4:
          message.focusDistance.push(FloatWithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    for (let i = 0; i < message.position.length; i++)
      Float3WithTimeCode.internalBinaryWrite(message.position[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    for (let i = 0; i < message.rotation.length; i++)
      QuatFWithTimeCode.internalBinaryWrite(message.rotation[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    for (let i = 0; i < message.focalLength.length; i++)
      FloatWithTimeCode.internalBinaryWrite(message.focalLength[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    for (let i = 0; i < message.focusDistance.length; i++)
      FloatWithTimeCode.internalBinaryWrite(message.focusDistance[i], writer.tag(4, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var Camera = new Camera$Type();
var FloatArrayWithTimeCode$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.FloatArrayWithTimeCode", [
      {
        no: 1,
        name: "time_code",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      },
      {
        no: 2,
        name: "values",
        kind: "scalar",
        repeat: 1,
        T: 2
        /*ScalarType.FLOAT*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.timeCode = 0;
    message.values = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* double time_code */
        1:
          message.timeCode = reader.double();
          break;
        case /* repeated float values */
        2:
          if (wireType === WireType.LengthDelimited)
            for (let e = reader.int32() + reader.pos; reader.pos < e; )
              message.values.push(reader.float());
          else
            message.values.push(reader.float());
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.timeCode !== 0)
      writer.tag(1, WireType.Bit64).double(message.timeCode);
    if (message.values.length) {
      writer.tag(2, WireType.LengthDelimited).fork();
      for (let i = 0; i < message.values.length; i++)
        writer.float(message.values[i]);
      writer.join();
    }
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var FloatArrayWithTimeCode = new FloatArrayWithTimeCode$Type();
var Float3ArrayWithTimeCode$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.Float3ArrayWithTimeCode", [
      {
        no: 1,
        name: "time_code",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      },
      { no: 2, name: "values", kind: "message", repeat: 2, T: () => Float3 }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.timeCode = 0;
    message.values = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* double time_code */
        1:
          message.timeCode = reader.double();
          break;
        case /* repeated nvidia_ace.animation_data.v1.Float3 values */
        2:
          message.values.push(Float3.internalBinaryRead(reader, reader.uint32(), options));
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.timeCode !== 0)
      writer.tag(1, WireType.Bit64).double(message.timeCode);
    for (let i = 0; i < message.values.length; i++)
      Float3.internalBinaryWrite(message.values[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var Float3ArrayWithTimeCode = new Float3ArrayWithTimeCode$Type();
var QuatFArrayWithTimeCode$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.QuatFArrayWithTimeCode", [
      {
        no: 1,
        name: "time_code",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      },
      { no: 2, name: "values", kind: "message", repeat: 2, T: () => QuatF }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.timeCode = 0;
    message.values = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* double time_code */
        1:
          message.timeCode = reader.double();
          break;
        case /* repeated nvidia_ace.animation_data.v1.QuatF values */
        2:
          message.values.push(QuatF.internalBinaryRead(reader, reader.uint32(), options));
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.timeCode !== 0)
      writer.tag(1, WireType.Bit64).double(message.timeCode);
    for (let i = 0; i < message.values.length; i++)
      QuatF.internalBinaryWrite(message.values[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var QuatFArrayWithTimeCode = new QuatFArrayWithTimeCode$Type();
var Float3WithTimeCode$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.Float3WithTimeCode", [
      {
        no: 1,
        name: "time_code",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      },
      { no: 2, name: "value", kind: "message", T: () => Float3 }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.timeCode = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* double time_code */
        1:
          message.timeCode = reader.double();
          break;
        case /* nvidia_ace.animation_data.v1.Float3 value */
        2:
          message.value = Float3.internalBinaryRead(reader, reader.uint32(), options, message.value);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.timeCode !== 0)
      writer.tag(1, WireType.Bit64).double(message.timeCode);
    if (message.value)
      Float3.internalBinaryWrite(message.value, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var Float3WithTimeCode = new Float3WithTimeCode$Type();
var QuatFWithTimeCode$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.QuatFWithTimeCode", [
      {
        no: 1,
        name: "time_code",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      },
      { no: 2, name: "value", kind: "message", T: () => QuatF }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.timeCode = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* double time_code */
        1:
          message.timeCode = reader.double();
          break;
        case /* nvidia_ace.animation_data.v1.QuatF value */
        2:
          message.value = QuatF.internalBinaryRead(reader, reader.uint32(), options, message.value);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.timeCode !== 0)
      writer.tag(1, WireType.Bit64).double(message.timeCode);
    if (message.value)
      QuatF.internalBinaryWrite(message.value, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var QuatFWithTimeCode = new QuatFWithTimeCode$Type();
var FloatWithTimeCode$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.FloatWithTimeCode", [
      {
        no: 1,
        name: "time_code",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      },
      {
        no: 2,
        name: "value",
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.timeCode = 0;
    message.value = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* double time_code */
        1:
          message.timeCode = reader.double();
          break;
        case /* float value */
        2:
          message.value = reader.float();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.timeCode !== 0)
      writer.tag(1, WireType.Bit64).double(message.timeCode);
    if (message.value !== 0)
      writer.tag(2, WireType.Bit32).float(message.value);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var FloatWithTimeCode = new FloatWithTimeCode$Type();
var QuatF$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.QuatF", [
      {
        no: 1,
        name: "real",
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 2,
        name: "i",
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 3,
        name: "j",
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 4,
        name: "k",
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.real = 0;
    message.i = 0;
    message.j = 0;
    message.k = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* float real */
        1:
          message.real = reader.float();
          break;
        case /* float i */
        2:
          message.i = reader.float();
          break;
        case /* float j */
        3:
          message.j = reader.float();
          break;
        case /* float k */
        4:
          message.k = reader.float();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.real !== 0)
      writer.tag(1, WireType.Bit32).float(message.real);
    if (message.i !== 0)
      writer.tag(2, WireType.Bit32).float(message.i);
    if (message.j !== 0)
      writer.tag(3, WireType.Bit32).float(message.j);
    if (message.k !== 0)
      writer.tag(4, WireType.Bit32).float(message.k);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var QuatF = new QuatF$Type();
var Float3$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.animation_data.v1.Float3", [
      {
        no: 1,
        name: "x",
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 2,
        name: "y",
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 3,
        name: "z",
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.x = 0;
    message.y = 0;
    message.z = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* float x */
        1:
          message.x = reader.float();
          break;
        case /* float y */
        2:
          message.y = reader.float();
          break;
        case /* float z */
        3:
          message.z = reader.float();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.x !== 0)
      writer.tag(1, WireType.Bit32).float(message.x);
    if (message.y !== 0)
      writer.tag(2, WireType.Bit32).float(message.y);
    if (message.z !== 0)
      writer.tag(3, WireType.Bit32).float(message.z);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var Float3 = new Float3$Type();

// gen/nvidia_ace.emotion_with_timecode.v1.ts
var EmotionWithTimeCode$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.emotion_with_timecode.v1.EmotionWithTimeCode", [
      {
        no: 1,
        name: "time_code",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      },
      { no: 2, name: "emotion", kind: "map", K: 9, V: {
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      } }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.timeCode = 0;
    message.emotion = {};
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* double time_code */
        1:
          message.timeCode = reader.double();
          break;
        case /* map<string, float> emotion */
        2:
          this.binaryReadMap2(message.emotion, reader, options);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  binaryReadMap2(map, reader, options) {
    let len = reader.uint32(), end = reader.pos + len, key, val;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          key = reader.string();
          break;
        case 2:
          val = reader.float();
          break;
        default:
          throw new globalThis.Error("unknown map entry field for nvidia_ace.emotion_with_timecode.v1.EmotionWithTimeCode.emotion");
      }
    }
    map[key ?? ""] = val ?? 0;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.timeCode !== 0)
      writer.tag(1, WireType.Bit64).double(message.timeCode);
    for (let k of globalThis.Object.keys(message.emotion))
      writer.tag(2, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.Bit32).float(message.emotion[k]).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var EmotionWithTimeCode = new EmotionWithTimeCode$Type();

// gen/nvidia_ace.a2f.v1.ts
var AudioStream$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.a2f.v1.AudioStream", [
      { no: 1, name: "audio_stream_header", kind: "message", oneof: "streamPart", T: () => AudioStreamHeader },
      { no: 2, name: "audio_with_emotion", kind: "message", oneof: "streamPart", T: () => AudioWithEmotion }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.streamPart = { oneofKind: void 0 };
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.a2f.v1.AudioStreamHeader audio_stream_header */
        1:
          message.streamPart = {
            oneofKind: "audioStreamHeader",
            audioStreamHeader: AudioStreamHeader.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.audioStreamHeader)
          };
          break;
        case /* nvidia_ace.a2f.v1.AudioWithEmotion audio_with_emotion */
        2:
          message.streamPart = {
            oneofKind: "audioWithEmotion",
            audioWithEmotion: AudioWithEmotion.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.audioWithEmotion)
          };
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.streamPart.oneofKind === "audioStreamHeader")
      AudioStreamHeader.internalBinaryWrite(message.streamPart.audioStreamHeader, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.streamPart.oneofKind === "audioWithEmotion")
      AudioWithEmotion.internalBinaryWrite(message.streamPart.audioWithEmotion, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AudioStream = new AudioStream$Type();
var AudioStreamHeader$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.a2f.v1.AudioStreamHeader", [
      { no: 1, name: "animation_ids", kind: "message", T: () => AnimationIds },
      { no: 2, name: "audio_header", kind: "message", T: () => AudioHeader },
      { no: 3, name: "face_params", kind: "message", T: () => FaceParameters },
      { no: 4, name: "emotion_post_processing_params", kind: "message", T: () => EmotionPostProcessingParameters },
      { no: 5, name: "blendshape_params", kind: "message", T: () => BlendShapeParameters },
      { no: 6, name: "emotion_params", kind: "message", T: () => EmotionParameters }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.animation_id.v1.AnimationIds animation_ids */
        1:
          message.animationIds = AnimationIds.internalBinaryRead(reader, reader.uint32(), options, message.animationIds);
          break;
        case /* nvidia_ace.audio.v1.AudioHeader audio_header */
        2:
          message.audioHeader = AudioHeader.internalBinaryRead(reader, reader.uint32(), options, message.audioHeader);
          break;
        case /* nvidia_ace.a2f.v1.FaceParameters face_params */
        3:
          message.faceParams = FaceParameters.internalBinaryRead(reader, reader.uint32(), options, message.faceParams);
          break;
        case /* nvidia_ace.a2f.v1.EmotionPostProcessingParameters emotion_post_processing_params */
        4:
          message.emotionPostProcessingParams = EmotionPostProcessingParameters.internalBinaryRead(reader, reader.uint32(), options, message.emotionPostProcessingParams);
          break;
        case /* nvidia_ace.a2f.v1.BlendShapeParameters blendshape_params */
        5:
          message.blendshapeParams = BlendShapeParameters.internalBinaryRead(reader, reader.uint32(), options, message.blendshapeParams);
          break;
        case /* nvidia_ace.a2f.v1.EmotionParameters emotion_params */
        6:
          message.emotionParams = EmotionParameters.internalBinaryRead(reader, reader.uint32(), options, message.emotionParams);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.animationIds)
      AnimationIds.internalBinaryWrite(message.animationIds, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.audioHeader)
      AudioHeader.internalBinaryWrite(message.audioHeader, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.faceParams)
      FaceParameters.internalBinaryWrite(message.faceParams, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    if (message.emotionPostProcessingParams)
      EmotionPostProcessingParameters.internalBinaryWrite(message.emotionPostProcessingParams, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
    if (message.blendshapeParams)
      BlendShapeParameters.internalBinaryWrite(message.blendshapeParams, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
    if (message.emotionParams)
      EmotionParameters.internalBinaryWrite(message.emotionParams, writer.tag(6, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AudioStreamHeader = new AudioStreamHeader$Type();
var FloatArray$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.a2f.v1.FloatArray", [
      {
        no: 1,
        name: "values",
        kind: "scalar",
        repeat: 1,
        T: 2
        /*ScalarType.FLOAT*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.values = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* repeated float values */
        1:
          if (wireType === WireType.LengthDelimited)
            for (let e = reader.int32() + reader.pos; reader.pos < e; )
              message.values.push(reader.float());
          else
            message.values.push(reader.float());
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.values.length) {
      writer.tag(1, WireType.LengthDelimited).fork();
      for (let i = 0; i < message.values.length; i++)
        writer.float(message.values[i]);
      writer.join();
    }
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var FloatArray = new FloatArray$Type();
var FaceParameters$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.a2f.v1.FaceParameters", [
      { no: 1, name: "float_params", kind: "map", K: 9, V: {
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      } },
      { no: 2, name: "integer_params", kind: "map", K: 9, V: {
        kind: "scalar",
        T: 5
        /*ScalarType.INT32*/
      } },
      { no: 3, name: "float_array_params", kind: "map", K: 9, V: { kind: "message", T: () => FloatArray } }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.floatParams = {};
    message.integerParams = {};
    message.floatArrayParams = {};
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* map<string, float> float_params */
        1:
          this.binaryReadMap1(message.floatParams, reader, options);
          break;
        case /* map<string, int32> integer_params */
        2:
          this.binaryReadMap2(message.integerParams, reader, options);
          break;
        case /* map<string, nvidia_ace.a2f.v1.FloatArray> float_array_params */
        3:
          this.binaryReadMap3(message.floatArrayParams, reader, options);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  binaryReadMap1(map, reader, options) {
    let len = reader.uint32(), end = reader.pos + len, key, val;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          key = reader.string();
          break;
        case 2:
          val = reader.float();
          break;
        default:
          throw new globalThis.Error("unknown map entry field for nvidia_ace.a2f.v1.FaceParameters.float_params");
      }
    }
    map[key ?? ""] = val ?? 0;
  }
  binaryReadMap2(map, reader, options) {
    let len = reader.uint32(), end = reader.pos + len, key, val;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          key = reader.string();
          break;
        case 2:
          val = reader.int32();
          break;
        default:
          throw new globalThis.Error("unknown map entry field for nvidia_ace.a2f.v1.FaceParameters.integer_params");
      }
    }
    map[key ?? ""] = val ?? 0;
  }
  binaryReadMap3(map, reader, options) {
    let len = reader.uint32(), end = reader.pos + len, key, val;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          key = reader.string();
          break;
        case 2:
          val = FloatArray.internalBinaryRead(reader, reader.uint32(), options);
          break;
        default:
          throw new globalThis.Error("unknown map entry field for nvidia_ace.a2f.v1.FaceParameters.float_array_params");
      }
    }
    map[key ?? ""] = val ?? FloatArray.create();
  }
  internalBinaryWrite(message, writer, options) {
    for (let k of globalThis.Object.keys(message.floatParams))
      writer.tag(1, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.Bit32).float(message.floatParams[k]).join();
    for (let k of globalThis.Object.keys(message.integerParams))
      writer.tag(2, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.Varint).int32(message.integerParams[k]).join();
    for (let k of globalThis.Object.keys(message.floatArrayParams)) {
      writer.tag(3, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k);
      writer.tag(2, WireType.LengthDelimited).fork();
      FloatArray.internalBinaryWrite(message.floatArrayParams[k], writer, options);
      writer.join().join();
    }
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var FaceParameters = new FaceParameters$Type();
var BlendShapeParameters$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.a2f.v1.BlendShapeParameters", [
      { no: 1, name: "bs_weight_multipliers", kind: "map", K: 9, V: {
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      } },
      { no: 2, name: "bs_weight_offsets", kind: "map", K: 9, V: {
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      } },
      {
        no: 3,
        name: "enable_clamping_bs_weight",
        kind: "scalar",
        opt: true,
        T: 8
        /*ScalarType.BOOL*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.bsWeightMultipliers = {};
    message.bsWeightOffsets = {};
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* map<string, float> bs_weight_multipliers */
        1:
          this.binaryReadMap1(message.bsWeightMultipliers, reader, options);
          break;
        case /* map<string, float> bs_weight_offsets */
        2:
          this.binaryReadMap2(message.bsWeightOffsets, reader, options);
          break;
        case /* optional bool enable_clamping_bs_weight */
        3:
          message.enableClampingBsWeight = reader.bool();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  binaryReadMap1(map, reader, options) {
    let len = reader.uint32(), end = reader.pos + len, key, val;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          key = reader.string();
          break;
        case 2:
          val = reader.float();
          break;
        default:
          throw new globalThis.Error("unknown map entry field for nvidia_ace.a2f.v1.BlendShapeParameters.bs_weight_multipliers");
      }
    }
    map[key ?? ""] = val ?? 0;
  }
  binaryReadMap2(map, reader, options) {
    let len = reader.uint32(), end = reader.pos + len, key, val;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          key = reader.string();
          break;
        case 2:
          val = reader.float();
          break;
        default:
          throw new globalThis.Error("unknown map entry field for nvidia_ace.a2f.v1.BlendShapeParameters.bs_weight_offsets");
      }
    }
    map[key ?? ""] = val ?? 0;
  }
  internalBinaryWrite(message, writer, options) {
    for (let k of globalThis.Object.keys(message.bsWeightMultipliers))
      writer.tag(1, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.Bit32).float(message.bsWeightMultipliers[k]).join();
    for (let k of globalThis.Object.keys(message.bsWeightOffsets))
      writer.tag(2, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.Bit32).float(message.bsWeightOffsets[k]).join();
    if (message.enableClampingBsWeight !== void 0)
      writer.tag(3, WireType.Varint).bool(message.enableClampingBsWeight);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var BlendShapeParameters = new BlendShapeParameters$Type();
var EmotionParameters$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.a2f.v1.EmotionParameters", [
      {
        no: 1,
        name: "live_transition_time",
        kind: "scalar",
        opt: true,
        T: 2
        /*ScalarType.FLOAT*/
      },
      { no: 2, name: "beginning_emotion", kind: "map", K: 9, V: {
        kind: "scalar",
        T: 2
        /*ScalarType.FLOAT*/
      } }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.beginningEmotion = {};
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* optional float live_transition_time */
        1:
          message.liveTransitionTime = reader.float();
          break;
        case /* map<string, float> beginning_emotion */
        2:
          this.binaryReadMap2(message.beginningEmotion, reader, options);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  binaryReadMap2(map, reader, options) {
    let len = reader.uint32(), end = reader.pos + len, key, val;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case 1:
          key = reader.string();
          break;
        case 2:
          val = reader.float();
          break;
        default:
          throw new globalThis.Error("unknown map entry field for nvidia_ace.a2f.v1.EmotionParameters.beginning_emotion");
      }
    }
    map[key ?? ""] = val ?? 0;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.liveTransitionTime !== void 0)
      writer.tag(1, WireType.Bit32).float(message.liveTransitionTime);
    for (let k of globalThis.Object.keys(message.beginningEmotion))
      writer.tag(2, WireType.LengthDelimited).fork().tag(1, WireType.LengthDelimited).string(k).tag(2, WireType.Bit32).float(message.beginningEmotion[k]).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var EmotionParameters = new EmotionParameters$Type();
var EmotionPostProcessingParameters$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.a2f.v1.EmotionPostProcessingParameters", [
      {
        no: 1,
        name: "emotion_contrast",
        kind: "scalar",
        opt: true,
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 2,
        name: "live_blend_coef",
        kind: "scalar",
        opt: true,
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 3,
        name: "enable_preferred_emotion",
        kind: "scalar",
        opt: true,
        T: 8
        /*ScalarType.BOOL*/
      },
      {
        no: 4,
        name: "preferred_emotion_strength",
        kind: "scalar",
        opt: true,
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 5,
        name: "emotion_strength",
        kind: "scalar",
        opt: true,
        T: 2
        /*ScalarType.FLOAT*/
      },
      {
        no: 6,
        name: "max_emotions",
        kind: "scalar",
        opt: true,
        T: 5
        /*ScalarType.INT32*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* optional float emotion_contrast */
        1:
          message.emotionContrast = reader.float();
          break;
        case /* optional float live_blend_coef */
        2:
          message.liveBlendCoef = reader.float();
          break;
        case /* optional bool enable_preferred_emotion */
        3:
          message.enablePreferredEmotion = reader.bool();
          break;
        case /* optional float preferred_emotion_strength */
        4:
          message.preferredEmotionStrength = reader.float();
          break;
        case /* optional float emotion_strength */
        5:
          message.emotionStrength = reader.float();
          break;
        case /* optional int32 max_emotions */
        6:
          message.maxEmotions = reader.int32();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.emotionContrast !== void 0)
      writer.tag(1, WireType.Bit32).float(message.emotionContrast);
    if (message.liveBlendCoef !== void 0)
      writer.tag(2, WireType.Bit32).float(message.liveBlendCoef);
    if (message.enablePreferredEmotion !== void 0)
      writer.tag(3, WireType.Varint).bool(message.enablePreferredEmotion);
    if (message.preferredEmotionStrength !== void 0)
      writer.tag(4, WireType.Bit32).float(message.preferredEmotionStrength);
    if (message.emotionStrength !== void 0)
      writer.tag(5, WireType.Bit32).float(message.emotionStrength);
    if (message.maxEmotions !== void 0)
      writer.tag(6, WireType.Varint).int32(message.maxEmotions);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var EmotionPostProcessingParameters = new EmotionPostProcessingParameters$Type();
var AudioWithEmotion$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.a2f.v1.AudioWithEmotion", [
      {
        no: 1,
        name: "audio_buffer",
        kind: "scalar",
        T: 12
        /*ScalarType.BYTES*/
      },
      { no: 2, name: "emotions", kind: "message", repeat: 2, T: () => EmotionWithTimeCode }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.audioBuffer = new Uint8Array(0);
    message.emotions = [];
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* bytes audio_buffer */
        1:
          message.audioBuffer = reader.bytes();
          break;
        case /* repeated nvidia_ace.emotion_with_timecode.v1.EmotionWithTimeCode emotions */
        2:
          message.emotions.push(EmotionWithTimeCode.internalBinaryRead(reader, reader.uint32(), options));
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.audioBuffer.length)
      writer.tag(1, WireType.LengthDelimited).bytes(message.audioBuffer);
    for (let i = 0; i < message.emotions.length; i++)
      EmotionWithTimeCode.internalBinaryWrite(message.emotions[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AudioWithEmotion = new AudioWithEmotion$Type();

// gen/nvidia_ace.controller.v1.ts
var EventType = /* @__PURE__ */ ((EventType2) => {
  EventType2[EventType2["END_OF_A2F_AUDIO_PROCESSING"] = 0] = "END_OF_A2F_AUDIO_PROCESSING";
  return EventType2;
})(EventType || {});
var AudioStream$Type2 = class extends MessageType {
  constructor() {
    super("nvidia_ace.controller.v1.AudioStream", [
      { no: 1, name: "audio_stream_header", kind: "message", oneof: "streamPart", T: () => AudioStreamHeader2 },
      { no: 2, name: "audio_with_emotion", kind: "message", oneof: "streamPart", T: () => AudioWithEmotion },
      { no: 3, name: "end_of_audio", kind: "message", oneof: "streamPart", T: () => AudioStream_EndOfAudio }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.streamPart = { oneofKind: void 0 };
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.controller.v1.AudioStreamHeader audio_stream_header */
        1:
          message.streamPart = {
            oneofKind: "audioStreamHeader",
            audioStreamHeader: AudioStreamHeader2.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.audioStreamHeader)
          };
          break;
        case /* nvidia_ace.a2f.v1.AudioWithEmotion audio_with_emotion */
        2:
          message.streamPart = {
            oneofKind: "audioWithEmotion",
            audioWithEmotion: AudioWithEmotion.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.audioWithEmotion)
          };
          break;
        case /* nvidia_ace.controller.v1.AudioStream.EndOfAudio end_of_audio */
        3:
          message.streamPart = {
            oneofKind: "endOfAudio",
            endOfAudio: AudioStream_EndOfAudio.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.endOfAudio)
          };
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.streamPart.oneofKind === "audioStreamHeader")
      AudioStreamHeader2.internalBinaryWrite(message.streamPart.audioStreamHeader, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.streamPart.oneofKind === "audioWithEmotion")
      AudioWithEmotion.internalBinaryWrite(message.streamPart.audioWithEmotion, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.streamPart.oneofKind === "endOfAudio")
      AudioStream_EndOfAudio.internalBinaryWrite(message.streamPart.endOfAudio, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AudioStream2 = new AudioStream$Type2();
var AudioStream_EndOfAudio$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.controller.v1.AudioStream.EndOfAudio", []);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AudioStream_EndOfAudio = new AudioStream_EndOfAudio$Type();
var AudioStreamHeader$Type2 = class extends MessageType {
  constructor() {
    super("nvidia_ace.controller.v1.AudioStreamHeader", [
      { no: 1, name: "audio_header", kind: "message", T: () => AudioHeader },
      { no: 2, name: "face_params", kind: "message", T: () => FaceParameters },
      { no: 3, name: "emotion_post_processing_params", kind: "message", T: () => EmotionPostProcessingParameters },
      { no: 4, name: "blendshape_params", kind: "message", T: () => BlendShapeParameters },
      { no: 5, name: "emotion_params", kind: "message", T: () => EmotionParameters }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.audio.v1.AudioHeader audio_header */
        1:
          message.audioHeader = AudioHeader.internalBinaryRead(reader, reader.uint32(), options, message.audioHeader);
          break;
        case /* nvidia_ace.a2f.v1.FaceParameters face_params */
        2:
          message.faceParams = FaceParameters.internalBinaryRead(reader, reader.uint32(), options, message.faceParams);
          break;
        case /* nvidia_ace.a2f.v1.EmotionPostProcessingParameters emotion_post_processing_params */
        3:
          message.emotionPostProcessingParams = EmotionPostProcessingParameters.internalBinaryRead(reader, reader.uint32(), options, message.emotionPostProcessingParams);
          break;
        case /* nvidia_ace.a2f.v1.BlendShapeParameters blendshape_params */
        4:
          message.blendshapeParams = BlendShapeParameters.internalBinaryRead(reader, reader.uint32(), options, message.blendshapeParams);
          break;
        case /* nvidia_ace.a2f.v1.EmotionParameters emotion_params */
        5:
          message.emotionParams = EmotionParameters.internalBinaryRead(reader, reader.uint32(), options, message.emotionParams);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.audioHeader)
      AudioHeader.internalBinaryWrite(message.audioHeader, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.faceParams)
      FaceParameters.internalBinaryWrite(message.faceParams, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.emotionPostProcessingParams)
      EmotionPostProcessingParameters.internalBinaryWrite(message.emotionPostProcessingParams, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    if (message.blendshapeParams)
      BlendShapeParameters.internalBinaryWrite(message.blendshapeParams, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
    if (message.emotionParams)
      EmotionParameters.internalBinaryWrite(message.emotionParams, writer.tag(5, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AudioStreamHeader2 = new AudioStreamHeader$Type2();
var Event$Type = class extends MessageType {
  constructor() {
    super("nvidia_ace.controller.v1.Event", [
      { no: 1, name: "event_type", kind: "enum", T: () => ["nvidia_ace.controller.v1.EventType", EventType] },
      { no: 2, name: "metadata", kind: "message", T: () => Any }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.eventType = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.controller.v1.EventType event_type */
        1:
          message.eventType = reader.int32();
          break;
        case /* optional google.protobuf.Any metadata */
        2:
          message.metadata = Any.internalBinaryRead(reader, reader.uint32(), options, message.metadata);
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.eventType !== 0)
      writer.tag(1, WireType.Varint).int32(message.eventType);
    if (message.metadata)
      Any.internalBinaryWrite(message.metadata, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var Event = new Event$Type();
var AnimationDataStreamHeader$Type2 = class extends MessageType {
  constructor() {
    super("nvidia_ace.controller.v1.AnimationDataStreamHeader", [
      { no: 1, name: "audio_header", kind: "message", T: () => AudioHeader },
      { no: 2, name: "skel_animation_header", kind: "message", T: () => SkelAnimationHeader },
      {
        no: 3,
        name: "start_time_code_since_epoch",
        kind: "scalar",
        T: 1
        /*ScalarType.DOUBLE*/
      }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.startTimeCodeSinceEpoch = 0;
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* optional nvidia_ace.audio.v1.AudioHeader audio_header */
        1:
          message.audioHeader = AudioHeader.internalBinaryRead(reader, reader.uint32(), options, message.audioHeader);
          break;
        case /* optional nvidia_ace.animation_data.v1.SkelAnimationHeader skel_animation_header */
        2:
          message.skelAnimationHeader = SkelAnimationHeader.internalBinaryRead(reader, reader.uint32(), options, message.skelAnimationHeader);
          break;
        case /* double start_time_code_since_epoch */
        3:
          message.startTimeCodeSinceEpoch = reader.double();
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.audioHeader)
      AudioHeader.internalBinaryWrite(message.audioHeader, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.skelAnimationHeader)
      SkelAnimationHeader.internalBinaryWrite(message.skelAnimationHeader, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.startTimeCodeSinceEpoch !== 0)
      writer.tag(3, WireType.Bit64).double(message.startTimeCodeSinceEpoch);
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AnimationDataStreamHeader2 = new AnimationDataStreamHeader$Type2();
var AnimationDataStream$Type2 = class extends MessageType {
  constructor() {
    super("nvidia_ace.controller.v1.AnimationDataStream", [
      { no: 1, name: "animation_data_stream_header", kind: "message", oneof: "streamPart", T: () => AnimationDataStreamHeader2 },
      { no: 2, name: "animation_data", kind: "message", oneof: "streamPart", T: () => AnimationData },
      { no: 3, name: "event", kind: "message", oneof: "streamPart", T: () => Event },
      { no: 4, name: "status", kind: "message", oneof: "streamPart", T: () => Status }
    ]);
  }
  create(value) {
    const message = globalThis.Object.create(this.messagePrototype);
    message.streamPart = { oneofKind: void 0 };
    if (value !== void 0)
      reflectionMergePartial(this, message, value);
    return message;
  }
  internalBinaryRead(reader, length, options, target) {
    let message = target ?? this.create(), end = reader.pos + length;
    while (reader.pos < end) {
      let [fieldNo, wireType] = reader.tag();
      switch (fieldNo) {
        case /* nvidia_ace.controller.v1.AnimationDataStreamHeader animation_data_stream_header */
        1:
          message.streamPart = {
            oneofKind: "animationDataStreamHeader",
            animationDataStreamHeader: AnimationDataStreamHeader2.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.animationDataStreamHeader)
          };
          break;
        case /* nvidia_ace.animation_data.v1.AnimationData animation_data */
        2:
          message.streamPart = {
            oneofKind: "animationData",
            animationData: AnimationData.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.animationData)
          };
          break;
        case /* nvidia_ace.controller.v1.Event event */
        3:
          message.streamPart = {
            oneofKind: "event",
            event: Event.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.event)
          };
          break;
        case /* nvidia_ace.status.v1.Status status */
        4:
          message.streamPart = {
            oneofKind: "status",
            status: Status.internalBinaryRead(reader, reader.uint32(), options, message.streamPart.status)
          };
          break;
        default:
          let u = options.readUnknownField;
          if (u === "throw")
            throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
          let d = reader.skip(wireType);
          if (u !== false)
            (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
      }
    }
    return message;
  }
  internalBinaryWrite(message, writer, options) {
    if (message.streamPart.oneofKind === "animationDataStreamHeader")
      AnimationDataStreamHeader2.internalBinaryWrite(message.streamPart.animationDataStreamHeader, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
    if (message.streamPart.oneofKind === "animationData")
      AnimationData.internalBinaryWrite(message.streamPart.animationData, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
    if (message.streamPart.oneofKind === "event")
      Event.internalBinaryWrite(message.streamPart.event, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
    if (message.streamPart.oneofKind === "status")
      Status.internalBinaryWrite(message.streamPart.status, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
    let u = options.writeUnknownFields;
    if (u !== false)
      (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
    return writer;
  }
};
var AnimationDataStream2 = new AnimationDataStream$Type2();

// gen/nvidia_ace.services.a2f_controller.v1.ts
var A2FControllerService = new ServiceType("nvidia_ace.services.a2f_controller.v1.A2FControllerService", [
  { name: "ProcessAudioStream", serverStreaming: true, clientStreaming: true, options: {}, I: AudioStream2, O: AnimationDataStream2 }
]);

// gen/nvidia_ace.services.a2f_controller.v1.client.ts
var A2FControllerServiceClient = class {
  constructor(_transport) {
    this._transport = _transport;
  }
  _transport;
  typeName = A2FControllerService.typeName;
  methods = A2FControllerService.methods;
  options = A2FControllerService.options;
  /**
   * Will process a single audio clip and answer animation data
   * in a burst.
   *
   * @generated from protobuf rpc: ProcessAudioStream
   */
  processAudioStream(options) {
    const method = this.methods[0], opt = this._transport.mergeOptions(options);
    return stackIntercept("duplex", this._transport, method, opt);
  }
};

// src/a2f-client.ts
var DEFAULT_ARKIT_NAMES = [
  "eyeLookUpLeft",
  "eyeLookUpRight",
  "eyeLookDownLeft",
  "eyeLookDownRight",
  "eyeLookInLeft",
  "eyeLookInRight",
  "eyeLookOutLeft",
  "eyeLookOutRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeSquintLeft",
  "eyeSquintRight",
  "eyeWideLeft",
  "eyeWideRight",
  "browDownLeft",
  "browDownRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight",
  "noseSneerLeft",
  "noseSneerRight",
  "cheekPuff",
  "cheekSquintLeft",
  "cheekSquintRight",
  "jawOpen",
  "jawForward",
  "jawLeft",
  "jawRight",
  "mouthFunnel",
  "mouthPucker",
  "mouthLeft",
  "mouthRight",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthDimpleLeft",
  "mouthDimpleRight",
  "mouthStretchLeft",
  "mouthStretchRight",
  "mouthRollLower",
  "mouthRollUpper",
  "mouthShrugLower",
  "mouthShrugUpper",
  "mouthPressLeft",
  "mouthPressRight",
  "mouthLowerDownLeft",
  "mouthLowerDownRight",
  "mouthUpperUpLeft",
  "mouthUpperUpRight",
  "tongueOut"
];
var Audio2FaceClient = class {
  client;
  options;
  blendshapeNames = [];
  call = null;
  constructor(options) {
    this.options = options;
    const transport = new GrpcWebFetchTransport({
      baseUrl: options.envoyUrl,
      format: "binary"
    });
    this.client = new A2FControllerServiceClient(transport);
  }
  /**
   * Start a bidirectional stream to Audio2Face.
   * Call sendAudioChunk() repeatedly, then call endAudio() when done.
   * Iterate responses() to receive blendshape weights in real time.
   */
  async startStream() {
    this.call = this.client.processAudioStream();
    const header = {
      audioHeader: {
        samplesPerSecond: this.options.sampleRate,
        bitsPerSample: this.options.bitsPerSample,
        channelCount: this.options.channels,
        audioFormat: 0 /* PCM */
      },
      faceParams: {
        floatParams: {},
        integerParams: {},
        floatArrayParams: {},
        ...this.options.faceParams
      },
      blendshapeParams: {
        bsWeightMultipliers: {},
        bsWeightOffsets: {},
        ...this.options.blendshapeParams
      },
      emotionPostProcessingParams: {
        ...this.options.emotionPostProcessing
      },
      emotionParams: {
        beginningEmotion: {},
        ...this.options.emotionParams
      }
    };
    const msg = {
      streamPart: {
        oneofKind: "audioStreamHeader",
        audioStreamHeader: header
      }
    };
    await this.call.requests.send(msg);
  }
  /**
   * Send an audio chunk. Must be Int16 PCM raw bytes.
   */
  async sendAudioChunk(int16Buffer) {
    if (!this.call) throw new Error("Stream not started. Call startStream() first.");
    const chunk = {
      audioBuffer: new Uint8Array(int16Buffer),
      emotions: []
    };
    const msg = {
      streamPart: {
        oneofKind: "audioWithEmotion",
        audioWithEmotion: chunk
      }
    };
    await this.call.requests.send(msg);
  }
  /**
   * Signal end of audio to trigger final blendshape generation.
   */
  async endAudio() {
    if (!this.call) throw new Error("Stream not started. Call startStream() first.");
    const msg = {
      streamPart: {
        oneofKind: "endOfAudio",
        endOfAudio: {}
      }
    };
    await this.call.requests.send(msg);
    await this.call.requests.complete();
  }
  /**
   * Async generator that yields blendshape weights as they arrive from A2F.
   * Also exposes header info (blendshapeNames) on the first response.
   */
  async *responses() {
    if (!this.call) throw new Error("Stream not started. Call startStream() first.");
    for await (const response of this.call.responses) {
      const part = response.streamPart;
      if (part.oneofKind === "animationDataStreamHeader") {
        const hdr = part.animationDataStreamHeader;
        if (hdr.skelAnimationHeader?.blendShapes.length) {
          this.blendshapeNames = hdr.skelAnimationHeader.blendShapes;
        }
      } else if (part.oneofKind === "animationData") {
        const anim = part.animationData;
        const skel = anim.skelAnimation;
        if (!skel) continue;
        for (const bs of skel.blendShapeWeights) {
          const values = bs.values;
          const weights = new Float32Array(52);
          const names = this.blendshapeNames.length ? this.blendshapeNames : DEFAULT_ARKIT_NAMES;
          for (let i = 0; i < Math.min(values.length, 52); i++) {
            if (names[i]) {
              const idx = DEFAULT_ARKIT_NAMES.indexOf(names[i]);
              if (idx >= 0) weights[idx] = values[i];
              else weights[i] = values[i];
            } else {
              weights[i] = values[i];
            }
          }
          yield {
            blendshapeNames: names,
            weights,
            timeCode: bs.timeCode,
            audioBuffer: anim.audio?.audioBuffer
          };
        }
      } else if (part.oneofKind === "status") {
        const st = part.status;
        console.log(`[A2F] Status ${st.code}: ${st.message}`);
      }
    }
  }
  /**
   * Convenience method: stream a complete Int16 audio buffer and yield all blendshape frames.
   */
  async *streamAudio(int16Buffer, chunkSizeSamples = 16e3) {
    await this.startStream();
    const bytesPerSample = this.options.bitsPerSample / 8;
    const chunkBytes = chunkSizeSamples * bytesPerSample;
    const total = int16Buffer.byteLength;
    for (let off = 0; off < total; off += chunkBytes) {
      const end = Math.min(off + chunkBytes, total);
      await this.sendAudioChunk(int16Buffer.slice(off, end));
    }
    await this.endAudio();
    yield* this.responses();
  }
};
window.Audio2FaceClient = Audio2FaceClient;
