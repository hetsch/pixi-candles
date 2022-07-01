/* eslint-disable */
 
/*!
 * @pixi/candles - v0.2.0
 * Compiled Fri, 01 Jul 2022 18:41:02 UTC
 *
 * @pixi/candles is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 * 
 * Copyright 2019-2020, Ivan Popelyshev, All Rights Reserved
 */
this.PIXI = this.PIXI || {};
this.PIXI.candles = this.PIXI.candles || {};
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@pixi/core'), require('@pixi/mesh'), require('@pixi/utils'), require('@pixi/constants'), require('@pixi/graphics')) :
    typeof define === 'function' && define.amd ? define(['exports', '@pixi/core', '@pixi/mesh', '@pixi/utils', '@pixi/constants', '@pixi/graphics'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global._pixi_candles = {}, global.PIXI, global.PIXI, global.PIXI.utils, global.PIXI, global.PIXI));
})(this, (function (exports, core, mesh, utils, constants, graphics) { 'use strict';

    const barVert = `
attribute vec4 aRect;
attribute vec2 aQuad;
attribute vec4 aColor;
uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform float resolution;
uniform vec4 uColor;
uniform float threshold;

varying vec2 vPos;
varying vec4 vDistance;
varying vec4 vColor;

void main(void){
vec2 p1 = (translationMatrix * vec3(aRect.xy, 1.0)).xy;
vec2 p2 = (translationMatrix * vec3(aRect.xy + aRect.zw, 1.0)).xy;
vec2 size = p2 - p1;

vec2 tQuad = (aQuad * 2.0 - 1.0) * threshold;
vec2 tWorld = tQuad;
if (size.x < 0.0) {
    tWorld.x = -tWorld.x;
}
if (size.y < 0.0) {
    tWorld.y = -tWorld.y;
}

vec2 localPos = (translationMatrix * vec3(aRect.zw * aQuad, 0.0)).xy;
vec2 cssPos = (p1 + localPos) + tWorld / resolution;
vDistance.xy = abs(localPos) * resolution + tQuad;
vDistance.zw = aRect.zw * resolution;
gl_Position = vec4((projectionMatrix * vec3(cssPos, 1.0)).xy, 0.0, 1.0);
vColor = aColor * uColor;
}`;
    const barFrag = `
varying vec2 vPos;
varying vec4 vDistance;
varying vec4 vColor;

void main(void) {
vec2 leftTop = max(vDistance.xy - 0.5, 0.0);
vec2 rightBottom = min(vDistance.xy + 0.5, vDistance.zw);
vec2 area = max(rightBottom - leftTop, 0.0);
float clip = area.x * area.y;

gl_FragColor = vColor * clip;
}`;
    class BarsShader extends mesh.MeshMaterial {
        constructor() {
            super(core.Texture.WHITE, {
                uniforms: {
                    resolution: 1,
                    threshold: 1,
                },
                program: BarsShader.getProgram()
            });
        }
        static getProgram() {
            if (!BarsShader._prog) {
                BarsShader._prog = new core.Program(barVert, barFrag);
            }
            return BarsShader._prog;
        }
    }
    BarsShader._prog = null;
    class BarsGeometry extends core.Geometry {
        constructor(_static = false) {
            super();
            this.lastLen = 0;
            this.lastPointNum = 0;
            this.lastPointData = 0;
            this.points = [];
            this._floatView = null;
            this._u32View = null;
            this._buffer = null;
            this._quad = null;
            this._indexBuffer = null;
            this.stridePoints = 5;
            this.strideFloats = 5;
            this.strideBytes = 20;
            this.legacyGeom = null;
            this.legacyBuffer = null;
            this.initGeom(_static);
            this.reset();
        }
        initGeom(_static) {
            this._buffer = new core.Buffer(new Float32Array(0), _static, false);
            this._quad = new core.Buffer(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), true, false);
            this._indexBuffer = new core.Buffer(new Uint16Array([0, 1, 2, 0, 2, 3]), true, true);
            this.addAttribute('aRect', this._buffer, 4, false, constants.TYPES.FLOAT, undefined, undefined, true)
                .addAttribute('aColor', this._buffer, 4, true, constants.TYPES.UNSIGNED_BYTE, undefined, undefined, true)
                .addAttribute('aQuad', this._quad, 2, false, constants.TYPES.FLOAT)
                .addIndex(this._indexBuffer);
        }
        addRect(x, y, w, h, color) {
            const { points } = this;
            points.push(x);
            points.push(y);
            points.push(w);
            points.push(h);
            points.push(color);
        }
        invalidate(pointNum = 0) {
            this.lastPointNum = Math.min(pointNum, this.lastPointNum);
        }
        reset() {
            if (this.lastLen > 0) {
                this.clearBufferData();
            }
            this.lastLen = 0;
            this.lastPointData = 0;
            this.points.length = 0;
            this.instanceCount = 0;
        }
        clearBufferData() {
            const { points, strideBytes, stridePoints } = this;
            this.lastPointNum = 0;
            this.lastPointData = 0;
            const arrBuf = new ArrayBuffer(strideBytes * points.length / stridePoints);
            this.lastLen = points.length;
            this._floatView = new Float32Array(arrBuf);
            this._u32View = new Uint32Array(arrBuf);
            this._buffer.update(arrBuf);
        }
        updateBuffer() {
            const { points, stridePoints, strideFloats } = this;
            if (this.lastLen > points.length) {
                this.lastLen = -1;
            }
            if (this.lastLen < points.length
                || this.lastPointNum < this.lastLen) {
                this.clearBufferData();
            }
            if (this.lastPointNum == this.lastLen) {
                return;
            }
            const { _floatView, _u32View } = this;
            this.lastPointData = Math.min(this.lastPointData, this.lastPointNum);
            let j = Math.round(this.lastPointNum * strideFloats / stridePoints);
            for (let i = this.lastPointNum; i < points.length; i += stridePoints) {
                _floatView[j++] = points[i];
                _floatView[j++] = points[i + 1];
                _floatView[j++] = points[i + 2];
                _floatView[j++] = points[i + 3];
                const rgb = points[i + 4];
                const bgra = ((rgb >> 16) & 0xff) | (rgb & 0xff00) | ((rgb & 0xff) << 16) | (255 << 24);
                _u32View[j++] = bgra;
            }
            this._buffer.update();
            this.instanceCount = Math.round(points.length / stridePoints);
            this.lastPointNum = this.lastLen;
            this.lastPointData = this.lastLen;
            if (this.legacyGeom) {
                this.updateLegacy();
            }
        }
        initLegacy() {
            if (this.legacyGeom) {
                return;
            }
            this.legacyGeom = new core.Geometry();
            this.legacyBuffer = new core.Buffer(new Float32Array(0), false, false);
            this.legacyGeom.addAttribute('aRect', this.legacyBuffer, 4, false, constants.TYPES.FLOAT)
                .addAttribute('aColor', this.legacyBuffer, 4, true, constants.TYPES.UNSIGNED_BYTE)
                .addAttribute('aQuad', this.legacyBuffer, 2, false, constants.TYPES.FLOAT)
                .addIndex(new core.Buffer(new Uint16Array([0, 1, 2, 0, 2, 3]), false, true));
        }
        updateLegacy() {
            const { legacyBuffer, _floatView, _u32View, strideFloats } = this;
            const strideLegacy = 7;
            const quadsCount = this._floatView.length / strideFloats;
            const legacyLen = quadsCount * strideLegacy * 4;
            if (legacyBuffer.data.length !== legacyLen) {
                legacyBuffer.data = new Float32Array(legacyLen);
                this.legacyGeom.getIndex().update(utils.createIndicesForQuads(quadsCount));
            }
            const floats = legacyBuffer.data;
            const quad = this._quad.data;
            for (let i = 0, j = 0; i < this._floatView.length;) {
                for (let k = 0; k < 4; k++) {
                    floats[j++] = _floatView[i];
                    floats[j++] = _floatView[i + 1];
                    floats[j++] = _floatView[i + 2];
                    floats[j++] = _floatView[i + 3];
                    floats[j++] = _floatView[i + 4];
                    floats[j++] = quad[k * 2];
                    floats[j++] = quad[k * 2 + 1];
                }
                i += strideFloats;
            }
            legacyBuffer.update();
        }
    }
    class Bars extends mesh.Mesh {
        constructor() {
            super(new BarsGeometry(), new BarsShader());
        }
        addRect(x, y, w, h, color) {
            const geometry = this.geometry;
            geometry.addRect(x, y, w, h, color);
        }
        clear() {
            this.geometry.reset();
        }
        _renderDefault(renderer) {
            const geometry = this.geometry;
            const useLegacy = !renderer.geometry.hasInstance;
            if (useLegacy) {
                geometry.initLegacy();
            }
            geometry.updateBuffer();
            if (geometry.instanceCount === 0) {
                return;
            }
            const rt = renderer.renderTexture.current;
            this.shader.uniforms.resolution = rt ? rt.baseTexture.resolution : renderer.resolution;
            const multisample = rt ? rt.framebuffer.multisample > 1 : renderer.options.antialias;
            this.shader.uniforms.threshold = multisample ? 2 : 1;
            if (useLegacy) {
                this.geometry = geometry.legacyGeom;
                super._renderDefault(renderer);
                this.geometry = geometry;
                return;
            }
            super._renderDefault(renderer);
        }
        _renderCanvas(renderer) {
            const { points } = this.geometry;
            const { context } = renderer;
            renderer.setContextTransform(this.transform.worldTransform);
            context.beginPath();
            let clr = -1;
            for (let i = 0; i < points.length; i += 5) {
                if (clr !== points[i + 4]) {
                    clr = points[i + 4];
                    let fill = utils.hex2string(clr);
                    context.fillStyle = fill;
                }
                context.beginPath();
                context.rect(points[i], points[i + 1], points[i + 2], points[i + 3]);
                context.fill();
            }
            context.beginPath();
        }
    }

    exports.JOINT_TYPE = void 0;
    (function (JOINT_TYPE) {
        JOINT_TYPE[JOINT_TYPE["NONE"] = 0] = "NONE";
        JOINT_TYPE[JOINT_TYPE["FILL"] = 1] = "FILL";
        JOINT_TYPE[JOINT_TYPE["JOINT_BEVEL"] = 4] = "JOINT_BEVEL";
        JOINT_TYPE[JOINT_TYPE["JOINT_MITER"] = 8] = "JOINT_MITER";
        JOINT_TYPE[JOINT_TYPE["JOINT_ROUND"] = 12] = "JOINT_ROUND";
        JOINT_TYPE[JOINT_TYPE["JOINT_CAP_BUTT"] = 16] = "JOINT_CAP_BUTT";
        JOINT_TYPE[JOINT_TYPE["JOINT_CAP_SQUARE"] = 18] = "JOINT_CAP_SQUARE";
        JOINT_TYPE[JOINT_TYPE["JOINT_CAP_ROUND"] = 20] = "JOINT_CAP_ROUND";
        JOINT_TYPE[JOINT_TYPE["FILL_EXPAND"] = 24] = "FILL_EXPAND";
        JOINT_TYPE[JOINT_TYPE["CAP_BUTT"] = 32] = "CAP_BUTT";
        JOINT_TYPE[JOINT_TYPE["CAP_SQUARE"] = 64] = "CAP_SQUARE";
        JOINT_TYPE[JOINT_TYPE["CAP_ROUND"] = 96] = "CAP_ROUND";
        JOINT_TYPE[JOINT_TYPE["CAP_BUTT2"] = 128] = "CAP_BUTT2";
    })(exports.JOINT_TYPE || (exports.JOINT_TYPE = {}));
    exports.LINE_SCALE_MODE = void 0;
    (function (LINE_SCALE_MODE) {
        LINE_SCALE_MODE["NONE"] = "none";
        LINE_SCALE_MODE["NORMAL"] = "normal";
        LINE_SCALE_MODE["HORIZONTAL"] = "horizontal";
        LINE_SCALE_MODE["VERTICAL"] = "vertical";
    })(exports.LINE_SCALE_MODE || (exports.LINE_SCALE_MODE = {}));
    const plotVert = `precision highp float;
const float FILL = 1.0;
const float BEVEL = 4.0;
const float MITER = 8.0;
const float ROUND = 12.0;
const float JOINT_CAP_BUTT = 16.0;
const float JOINT_CAP_SQUARE = 18.0;
const float JOINT_CAP_ROUND = 20.0;

const float FILL_EXPAND = 24.0;

const float CAP_BUTT = 1.0;
const float CAP_SQUARE = 2.0;
const float CAP_ROUND = 3.0;
const float CAP_BUTT2 = 4.0;

// === geom ===
attribute vec2 aPrev;
attribute vec2 aPoint1;
attribute vec2 aPoint2;
attribute vec2 aNext;
attribute float aVertexJoint;
attribute float vertexNum;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;

varying vec4 vDistance;
varying vec4 vArc;
varying float vType;

uniform float resolution;
uniform float expand;
uniform float miterLimit;
uniform float scaleMode;
uniform vec2 styleLine;

vec2 doBisect(vec2 norm, float len, vec2 norm2, float len2,
    float dy, float inner) {
    vec2 bisect = (norm + norm2) / 2.0;
    bisect /= dot(norm, bisect);
    vec2 shift = dy * bisect;
    if (inner > 0.5) {
        if (len < len2) {
            if (abs(dy * (bisect.x * norm.y - bisect.y * norm.x)) > len) {
                return dy * norm;
            }
        } else {
            if (abs(dy * (bisect.x * norm2.y - bisect.y * norm2.x)) > len2) {
                return dy * norm;
            }
        }
    }
    return dy * bisect;
}

void main(void){
    vec2 pointA = (translationMatrix * vec3(aPoint1, 1.0)).xy;
    vec2 pointB = (translationMatrix * vec3(aPoint2, 1.0)).xy;

    vec2 xBasis = pointB - pointA;
    float len = length(xBasis);
    vec2 forward = xBasis / len;
    vec2 norm = vec2(forward.y, -forward.x);

    float type = aVertexJoint;

    float lineWidth = styleLine.x;
    if (scaleMode > 2.5) {
        lineWidth *= length(translationMatrix * vec3(1.0, 0.0, 0.0));
    } else if (scaleMode > 1.5) {
        lineWidth *= length(translationMatrix * vec3(0.0, 1.0, 0.0));
    } else if (scaleMode > 0.5) {
        vec2 avgDiag = (translationMatrix * vec3(1.0, 1.0, 0.0)).xy;
        lineWidth *= sqrt(dot(avgDiag, avgDiag) * 0.5);
    }
    float capType = floor(type / 32.0);
    type -= capType * 32.0;
    vArc = vec4(0.0);
    lineWidth *= 0.5;
    float lineAlignment = 2.0 * styleLine.y - 1.0;

    vec2 pos;

    if (capType == CAP_ROUND) {
        if (vertexNum < 3.5) {
            gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
            return;
        }
        type = JOINT_CAP_ROUND;
        capType = 0.0;
    }

    if (type >= BEVEL) {
        float dy = lineWidth + expand;
        float inner = 0.0;
        if (vertexNum >= 1.5) {
            dy = -dy;
            inner = 1.0;
        }

        vec2 base, next, xBasis2, bisect;
        float flag = 0.0;
        float sign2 = 1.0;
        if (vertexNum < 0.5 || vertexNum > 2.5 && vertexNum < 3.5) {
            next = (translationMatrix * vec3(aPrev, 1.0)).xy;
            base = pointA;
            flag = type - floor(type / 2.0) * 2.0;
            sign2 = -1.0;
        } else {
            next = (translationMatrix * vec3(aNext, 1.0)).xy;
            base = pointB;
            if (type >= MITER && type < MITER + 3.5) {
                flag = step(MITER + 1.5, type);
                // check miter limit here?
            }
        }
        xBasis2 = next - base;
        float len2 = length(xBasis2);
        vec2 norm2 = vec2(xBasis2.y, -xBasis2.x) / len2;
        float D = norm.x * norm2.y - norm.y * norm2.x;
        if (D < 0.0) {
            inner = 1.0 - inner;
        }

        norm2 *= sign2;

        if (abs(lineAlignment) > 0.01) {
            float shift = lineWidth * lineAlignment;
            pointA += norm * shift;
            pointB += norm * shift;
            if (abs(D) < 0.01) {
                base += norm * shift;
            } else {
                base += doBisect(norm, len, norm2, len2, shift, 0.0);
            }
        }

        float collinear = step(0.0, dot(norm, norm2));

        vType = 0.0;
        float dy2 = -1000.0;
        float dy3 = -1000.0;

        if (abs(D) < 0.01 && collinear < 0.5) {
            if (type >= ROUND && type < ROUND + 1.5) {
                type = JOINT_CAP_ROUND;
            }
            //TODO: BUTT here too
        }

        if (vertexNum < 3.5) {
            if (abs(D) < 0.01) {
                pos = dy * norm;
            } else {
                if (flag < 0.5 && inner < 0.5) {
                    pos = dy * norm;
                } else {
                    pos = doBisect(norm, len, norm2, len2, dy, inner);
                }
            }
            if (capType >= CAP_BUTT && capType < CAP_ROUND) {
                float extra = step(CAP_SQUARE, capType) * lineWidth;
                vec2 back = -forward;
                if (vertexNum < 0.5 || vertexNum > 2.5) {
                    pos += back * (expand + extra);
                    dy2 = expand;
                } else {
                    dy2 = dot(pos + base - pointA, back) - extra;
                }
            }
            if (type >= JOINT_CAP_BUTT && type < JOINT_CAP_SQUARE + 0.5) {
                float extra = step(JOINT_CAP_SQUARE, type) * lineWidth;
                if (vertexNum < 0.5 || vertexNum > 2.5) {
                    dy3 = dot(pos + base - pointB, forward) - extra;
                } else {
                    pos += forward * (expand + extra);
                    dy3 = expand;
                    if (capType >= CAP_BUTT) {
                        dy2 -= expand + extra;
                    }
                }
            }
        } else if (type >= JOINT_CAP_ROUND && type < JOINT_CAP_ROUND + 1.5) {
            if (inner > 0.5) {
                dy = -dy;
                inner = 0.0;
            }
            vec2 d2 = abs(dy) * forward;
            if (vertexNum < 4.5) {
                dy = -dy;
                pos = dy * norm;
            } else if (vertexNum < 5.5) {
                pos = dy * norm;
            } else if (vertexNum < 6.5) {
                pos = dy * norm + d2;
                vArc.x = abs(dy);
            } else {
                dy = -dy;
                pos = dy * norm + d2;
                vArc.x = abs(dy);
            }
            dy2 = 0.0;
            vArc.y = dy;
            vArc.z = 0.0;
            vArc.w = lineWidth;
            vType = 3.0;
        } else if (abs(D) < 0.01) {
            pos = dy * norm;
        } else {
            if (type >= ROUND && type < ROUND + 1.5) {
                if (inner > 0.5) {
                    dy = -dy;
                    inner = 0.0;
                }
                if (vertexNum < 4.5) {
                    pos = doBisect(norm, len, norm2, len2, -dy, 1.0);
                } else if (vertexNum < 5.5) {
                    pos = dy * norm;
                } else if (vertexNum > 7.5) {
                    pos = dy * norm2;
                } else {
                    pos = doBisect(norm, len, norm2, len2, dy, 0.0);
                    float d2 = abs(dy);
                    if (length(pos) > abs(dy) * 1.5) {
                        if (vertexNum < 6.5) {
                            pos.x = dy * norm.x - d2 * norm.y;
                            pos.y = dy * norm.y + d2 * norm.x;
                        } else {
                            pos.x = dy * norm2.x + d2 * norm2.y;
                            pos.y = dy * norm2.y - d2 * norm2.x;
                        }
                    }
                }
                vec2 norm3 = normalize(norm + norm2);

                float sign = step(0.0, dy) * 2.0 - 1.0;
                vArc.x = sign * dot(pos, norm3);
                vArc.y = pos.x * norm3.y - pos.y * norm3.x;
                vArc.z = dot(norm, norm3) * lineWidth;
                vArc.w = lineWidth;

                dy = -sign * dot(pos, norm);
                dy2 = -sign * dot(pos, norm2);
                dy3 = vArc.z - vArc.x;
                vType = 3.0;
            } else {
                float hit = 0.0;
                if (type >= BEVEL && type < BEVEL + 1.5) {
                    if (dot(norm, norm2) > 0.0) {
                        type = MITER;
                    }
                }

                if (type >= MITER && type < MITER + 3.5) {
                    if (inner > 0.5) {
                        dy = -dy;
                        inner = 0.0;
                    }
                    float sign = step(0.0, dy) * 2.0 - 1.0;
                    pos = doBisect(norm, len, norm2, len2, dy, 0.0);
                    if (length(pos) > abs(dy) * miterLimit) {
                        type = BEVEL;
                    } else {
                        if (vertexNum < 4.5) {
                            dy = -dy;
                            pos = doBisect(norm, len, norm2, len2, dy, 1.0);
                        } else if (vertexNum < 5.5) {
                            pos = dy * norm;
                        } else if (vertexNum > 6.5) {
                            pos = dy * norm2;
                        }
                        vType = 1.0;
                        dy = -sign * dot(pos, norm);
                        dy2 = -sign * dot(pos, norm2);
                        hit = 1.0;
                    }
                }
                if (type >= BEVEL && type < BEVEL + 1.5) {
                    if (inner > 0.5) {
                        dy = -dy;
                        inner = 0.0;
                    }
                    float d2 = abs(dy);
                    vec2 pos3 = vec2(dy * norm.x - d2 * norm.y, dy * norm.y + d2 * norm.x);
                    vec2 pos4 = vec2(dy * norm2.x + d2 * norm2.y, dy * norm2.y - d2 * norm2.x);
                    if (vertexNum < 4.5) {
                        pos = doBisect(norm, len, norm2, len2, -dy, 1.0);
                    } else if (vertexNum < 5.5) {
                        pos = dy * norm;
                    } else if (vertexNum > 7.5) {
                        pos = dy * norm2;
                    } else {
                        if (vertexNum < 6.5) {
                            pos = pos3;
                        } else {
                            pos = pos4;
                        }
                    }
                    vec2 norm3 = normalize(norm + norm2);
                    float sign = step(0.0, dy) * 2.0 - 1.0;

                    dy = -sign * dot(pos, norm);
                    dy2 = -sign * dot(pos, norm2);
                    dy3 = (-sign * dot(pos, norm3)) + lineWidth;
                    vType = 4.0;
                    hit = 1.0;
                }
                if (hit < 0.5) {
                    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
                    return;
                }
            }
        }

        pos += base;
        vDistance = vec4(dy, dy2, dy3, lineWidth) * resolution;
        vArc = vArc * resolution;
    }

    gl_Position = vec4((projectionMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);
}`;
    const plotFrag = `precision highp float;
varying vec4 vDistance;
varying vec4 vArc;
varying float vType;
uniform vec4 uColor;

void main(void){
    float alpha = 1.0;
    float lineWidth = vDistance.w;
    if (vType < 0.5) {
        float left = max(vDistance.x - 0.5, -vDistance.w);
        float right = min(vDistance.x + 0.5, vDistance.w);
        float near = vDistance.y - 0.5;
        float far = min(vDistance.y + 0.5, 0.0);
        float top = vDistance.z - 0.5;
        float bottom = min(vDistance.z + 0.5, 0.0);
        alpha = max(right - left, 0.0) * max(bottom - top, 0.0) * max(far - near, 0.0);
    } else if (vType < 1.5) {
        float a1 = clamp(vDistance.x + 0.5 - lineWidth, 0.0, 1.0);
        float a2 = clamp(vDistance.x + 0.5 + lineWidth, 0.0, 1.0);
        float b1 = clamp(vDistance.y + 0.5 - lineWidth, 0.0, 1.0);
        float b2 = clamp(vDistance.y + 0.5 + lineWidth, 0.0, 1.0);
        alpha = a2 * b2 - a1 * b1;
    } else if (vType < 2.5) {
        alpha *= max(min(vDistance.x + 0.5, 1.0), 0.0);
        alpha *= max(min(vDistance.y + 0.5, 1.0), 0.0);
        alpha *= max(min(vDistance.z + 0.5, 1.0), 0.0);
    } else if (vType < 3.5) {
        float a1 = clamp(vDistance.x + 0.5 - lineWidth, 0.0, 1.0);
        float a2 = clamp(vDistance.x + 0.5 + lineWidth, 0.0, 1.0);
        float b1 = clamp(vDistance.y + 0.5 - lineWidth, 0.0, 1.0);
        float b2 = clamp(vDistance.y + 0.5 + lineWidth, 0.0, 1.0);
        float alpha_miter = a2 * b2 - a1 * b1;

        float alpha_plane = max(min(vDistance.z + 0.5, 1.0), 0.0);

        float d = length(vArc.xy);
        float circle_hor = max(min(vArc.w, d + 0.5) - max(-vArc.w, d - 0.5), 0.0);
        float circle_vert = min(vArc.w * 2.0, 1.0);
        float alpha_circle = circle_hor * circle_vert;

        alpha = min(alpha_miter, max(alpha_circle, alpha_plane));
    } else {
        float a1 = clamp(vDistance.x + 0.5 - lineWidth, 0.0, 1.0);
        float a2 = clamp(vDistance.x + 0.5 + lineWidth, 0.0, 1.0);
        float b1 = clamp(vDistance.y + 0.5 - lineWidth, 0.0, 1.0);
        float b2 = clamp(vDistance.y + 0.5 + lineWidth, 0.0, 1.0);
        alpha = a2 * b2 - a1 * b1;
        alpha *= max(min(vDistance.z + 0.5, 1.0), 0.0);
    }
    gl_FragColor = uColor * alpha;
}
`;
    class PlotShader extends mesh.MeshMaterial {
        constructor() {
            super(core.Texture.WHITE, {
                uniforms: {
                    resolution: 1,
                    expand: 1,
                    scaleMode: 1,
                    styleLine: new Float32Array([1.0, 0.5]),
                    miterLimit: 5.0,
                },
                program: PlotShader.getProgram()
            });
        }
        static getProgram() {
            if (!PlotShader._prog) {
                PlotShader._prog = new core.Program(plotVert, plotFrag);
            }
            return PlotShader._prog;
        }
    }
    PlotShader._prog = null;
    function multIndex(indices, vertCount, instanceCount, support32 = true) {
        const size = indices.length;
        const ind = support32 ? new Uint32Array(size * instanceCount) : new Uint16Array(size * instanceCount);
        for (let i = 0; i < instanceCount; i++) {
            for (let j = 0; j < size; j++) {
                ind[i * size + j] = indices[j] + vertCount * i;
            }
        }
        return ind;
    }
    class PlotGeometry extends core.Geometry {
        constructor(_static = false) {
            super();
            this.joinStyle = graphics.LINE_JOIN.MITER;
            this.capStyle = graphics.LINE_CAP.SQUARE;
            this.lastLen = 0;
            this.lastPointNum = 0;
            this.lastPointData = 0;
            this.updateId = 0;
            this.points = [];
            this._floatView = null;
            this._u32View = null;
            this._buffer = null;
            this._quad = null;
            this._indexBuffer = null;
            this._vertexNums = null;
            this.support32 = false;
            this.stridePoints = 2;
            this.strideFloats = 3;
            this.strideBytes = 3 * 4;
            this.legacyGeom = null;
            this.legacyBuffer = null;
            this.initGeom(_static);
            this.reset();
        }
        initGeom(_static) {
            this._buffer = new core.Buffer(new Float32Array(0), _static, false);
            this._vertexNums = new core.Buffer(new Float32Array([0, 1, 2, 3, 4, 5, 6, 7, 8]), true, false);
            this._indexBuffer = new core.Buffer(new Uint16Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 4, 7, 8]), true, true);
            this.addAttribute('aPrev', this._buffer, 2, false, constants.TYPES.FLOAT, 3 * 4, 0 * 4, true)
                .addAttribute('aPoint1', this._buffer, 2, false, constants.TYPES.FLOAT, 3 * 4, 3 * 4, true)
                .addAttribute('aPoint2', this._buffer, 2, false, constants.TYPES.FLOAT, 3 * 4, 6 * 4, true)
                .addAttribute('aNext', this._buffer, 2, false, constants.TYPES.FLOAT, 3 * 4, 9 * 4, true)
                .addAttribute('aVertexJoint', this._buffer, 1, false, constants.TYPES.FLOAT, 3 * 4, 5 * 4, true)
                .addAttribute('vertexNum', this._vertexNums, 1, false, constants.TYPES.FLOAT)
                .addIndex(this._indexBuffer);
        }
        moveTo(x, y) {
            const { points } = this;
            points.push(x);
            points.push(y);
        }
        lineTo(x, y) {
            const { points } = this;
            points.push(x);
            points.push(y);
        }
        lineBy(dx, dy) {
            const { points, stridePoints } = this;
            const x = points[points.length - stridePoints];
            const y = points[points.length - stridePoints + 1];
            points.push(x + dx);
            points.push(y + dy);
        }
        invalidate(pointNum = 0) {
            this.lastPointNum = Math.min(pointNum, this.lastPointNum);
            this.updateId++;
        }
        reset() {
            if (this.lastLen > 0) {
                this.clearBufferData();
            }
            this.updateId++;
            this.lastLen = 0;
            this.lastPointData = 0;
            this.points.length = 0;
            this.instanceCount = 0;
        }
        clearBufferData() {
            const { points, strideBytes, stridePoints } = this;
            this.lastPointNum = 0;
            this.lastPointData = 0;
            const arrayLen = Math.max(0, points.length / stridePoints + 3);
            const arrBuf = new ArrayBuffer(strideBytes * arrayLen);
            this.lastLen = points.length;
            this._floatView = new Float32Array(arrBuf);
            this._u32View = new Uint32Array(arrBuf);
            this._buffer.update(arrBuf);
        }
        updateBuffer() {
            const { points, stridePoints, strideFloats } = this;
            if (this.lastLen > points.length) {
                this.lastLen = -1;
            }
            if (this.lastLen < points.length
                || this.lastPointNum < this.lastLen) {
                this.clearBufferData();
            }
            if (this.lastPointNum == this.lastLen) {
                return;
            }
            const jointType = this.jointType();
            const capType = this.capType();
            let endJoint = capType;
            if (capType === exports.JOINT_TYPE.CAP_ROUND) {
                endJoint = exports.JOINT_TYPE.JOINT_CAP_ROUND;
            }
            if (capType === exports.JOINT_TYPE.CAP_BUTT) {
                endJoint = exports.JOINT_TYPE.JOINT_CAP_BUTT;
            }
            if (capType === exports.JOINT_TYPE.CAP_SQUARE) {
                endJoint = exports.JOINT_TYPE.JOINT_CAP_SQUARE;
            }
            const { _floatView, _u32View } = this;
            if (this.lastPointNum > 0) {
                this.lastPointNum--;
            }
            if (this.lastPointNum > 0) {
                this.lastPointNum--;
            }
            this.lastPointData = Math.min(this.lastPointData, this.lastPointNum);
            let j = (Math.round(this.lastPointNum / stridePoints) + 2) * strideFloats;
            for (let i = this.lastPointNum; i < points.length; i += stridePoints) {
                _floatView[j++] = points[i];
                _floatView[j++] = points[i + 1];
                if (isNaN(points[i]) || isNaN(points[i + 1])) {
                    _floatView[j - 2] = (points[i + 2] + points[i - 2]) * 0.5;
                    _floatView[j - 1] = (points[i + 3] + points[i - 1]) * 0.5;
                    _floatView[j] = 0;
                    j++;
                    continue;
                }
                _floatView[j] = jointType;
                if (i == 0) {
                    if (capType !== exports.JOINT_TYPE.CAP_ROUND) {
                        _floatView[j] += capType;
                    }
                }
                else {
                    if (isNaN(points[i - 2]) || isNaN(points[i - 1])) {
                        _floatView[j] += exports.JOINT_TYPE.CAP_BUTT;
                    }
                }
                if (i + stridePoints * 2 >= points.length || isNaN(points[i + 4]) || isNaN(points[i + 5])) {
                    _floatView[j] += endJoint - jointType;
                }
                else if (i + stridePoints >= points.length || isNaN(points[i + 2]) || isNaN(points[i + 3])) {
                    _floatView[j] = 0;
                }
                j++;
            }
            _floatView[j++] = points[points.length - 4];
            _floatView[j++] = points[points.length - 3];
            _floatView[j++] = 0;
            _floatView[0] = points[0];
            _floatView[1] = points[1];
            _floatView[2] = 0;
            _floatView[3] = points[2];
            _floatView[4] = points[3];
            _floatView[5] = capType === exports.JOINT_TYPE.CAP_ROUND ? capType : 0;
            this._buffer.update();
            this.instanceCount = Math.round(points.length / stridePoints);
            this.lastPointNum = this.lastLen;
            this.lastPointData = this.lastLen;
            if (this.legacyGeom) {
                this.updateLegacy();
            }
        }
        initLegacy(support32) {
            if (this.legacyGeom) {
                return;
            }
            const ind = [0, 1, 2, 0, 2, 3];
            this.support32 = support32;
            this.legacyGeom = new core.Geometry();
            this.legacyBuffer = new core.Buffer(new Float32Array(0), false, false);
            this.legacyGeom.addAttribute('aPrev', this.legacyBuffer, 2, false, constants.TYPES.FLOAT)
                .addAttribute('aPoint1', this.legacyBuffer, 2, false, constants.TYPES.FLOAT)
                .addAttribute('aPoint2', this.legacyBuffer, 2, false, constants.TYPES.FLOAT)
                .addAttribute('aNext', this.legacyBuffer, 2, false, constants.TYPES.FLOAT)
                .addAttribute('aVertexJoint', this.legacyBuffer, 1, false, constants.TYPES.FLOAT)
                .addAttribute('vertexNum', this.legacyBuffer, 1, false, constants.TYPES.FLOAT)
                .addIndex(new core.Buffer(support32 ? new Uint32Array(ind) : new Uint16Array(ind), false, true));
        }
        updateLegacy() {
            const { legacyBuffer, _floatView, _u32View, strideFloats } = this;
            const strideLegacy = 10;
            const vcount = 9;
            const instanceCount = (this._floatView.length / strideFloats - 3);
            const legacyLen = instanceCount * strideLegacy * vcount;
            if (legacyBuffer.data.length !== legacyLen) {
                legacyBuffer.data = new Float32Array(legacyLen);
                this.legacyGeom.getIndex().update(multIndex(this._indexBuffer.data, vcount, instanceCount, this.support32));
            }
            const floats = legacyBuffer.data;
            for (let i = 0, j = 0; j < legacyLen; i += strideFloats) {
                for (let k = 0; k < vcount; k++) {
                    floats[j++] = _floatView[i];
                    floats[j++] = _floatView[i + 1];
                    floats[j++] = _floatView[i + 3];
                    floats[j++] = _floatView[i + 4];
                    floats[j++] = _floatView[i + 6];
                    floats[j++] = _floatView[i + 7];
                    floats[j++] = _floatView[i + 9];
                    floats[j++] = _floatView[i + 10];
                    floats[j++] = _floatView[i + 5];
                    floats[j++] = k;
                }
            }
        }
        capType() {
            let cap;
            switch (this.capStyle) {
                case graphics.LINE_CAP.SQUARE:
                    cap = exports.JOINT_TYPE.CAP_SQUARE;
                    break;
                case graphics.LINE_CAP.ROUND:
                    cap = exports.JOINT_TYPE.CAP_ROUND;
                    break;
                default:
                    cap = exports.JOINT_TYPE.CAP_BUTT;
                    break;
            }
            return cap;
        }
        goodJointType() {
            let joint;
            switch (this.joinStyle) {
                case graphics.LINE_JOIN.BEVEL:
                    joint = exports.JOINT_TYPE.JOINT_BEVEL;
                    break;
                case graphics.LINE_JOIN.ROUND:
                    joint = exports.JOINT_TYPE.JOINT_ROUND;
                    break;
                default:
                    joint = exports.JOINT_TYPE.JOINT_MITER + 3;
                    break;
            }
            return joint;
        }
        jointType() {
            let joint;
            switch (this.joinStyle) {
                case graphics.LINE_JOIN.BEVEL:
                    joint = exports.JOINT_TYPE.JOINT_BEVEL;
                    break;
                case graphics.LINE_JOIN.ROUND:
                    joint = exports.JOINT_TYPE.JOINT_ROUND;
                    break;
                default:
                    joint = exports.JOINT_TYPE.JOINT_MITER;
                    break;
            }
            return joint;
        }
    }
    class Plot extends mesh.Mesh {
        constructor(options) {
            const geometry = new PlotGeometry();
            const shader = new PlotShader();
            let scaleMode = exports.LINE_SCALE_MODE.NORMAL;
            if (options) {
                if (options.lineWidth !== undefined) {
                    shader.uniforms.styleLine[0] = options.lineWidth;
                }
                if (options.nativeLineWidth !== undefined) {
                    shader.uniforms.styleLine[0] = options.nativeLineWidth;
                    scaleMode = exports.LINE_SCALE_MODE.NONE;
                }
                if (options.joinStyle !== undefined) {
                    geometry.joinStyle = options.joinStyle;
                }
                if (options.capStyle !== undefined) {
                    geometry.capStyle = options.capStyle;
                }
            }
            super(geometry, shader);
            this.scaleMode = scaleMode;
        }
        moveTo(x, y) {
            const geometry = this.geometry;
            geometry.moveTo(x, y);
        }
        lineTo(x, y) {
            const geometry = this.geometry;
            geometry.lineTo(x, y);
        }
        lineBy(x, y) {
            const geometry = this.geometry;
            geometry.lineBy(x, y);
        }
        lineStyle(width, nativeWidth, joinStyle, capStyle) {
            const param = width;
            if (param instanceof Object) {
                this.gLineStyle(param);
                return;
            }
            const geometry = this.geometry;
            if (width !== undefined) {
                this.shader.uniforms.styleLine[0] = width;
                this.scaleMode = exports.LINE_SCALE_MODE.NORMAL;
            }
            if (nativeWidth !== undefined) {
                this.shader.uniforms.styleLine[0] = nativeWidth;
                this.scaleMode = exports.LINE_SCALE_MODE.NONE;
            }
            if (joinStyle !== undefined) {
                geometry.joinStyle = joinStyle;
            }
            if (capStyle !== undefined) {
                geometry.capStyle = capStyle;
            }
            geometry.invalidate();
        }
        gLineStyle(obj) {
            const geometry = this.geometry;
            if (obj.width !== undefined) {
                this.shader.uniforms.styleLine[0] = obj.width;
            }
            if (obj.alignment !== undefined) {
                this.shader.uniforms.styleLine[0] = obj.alignment;
            }
            if (obj.scaleMode !== undefined) {
                this.shader.uniforms.scaleMode = obj.scaleMode;
            }
            if (obj.color !== undefined) {
                this.tint = obj.color;
            }
            if (obj.join !== undefined) {
                geometry.joinStyle = obj.join;
            }
            if (obj.cap !== undefined) {
                geometry.capStyle = obj.cap;
            }
        }
        set scaleMode(value) {
            this._scaleMode = value;
            let intVal = 0;
            switch (value) {
                case exports.LINE_SCALE_MODE.NORMAL:
                    intVal = 1;
                    break;
                case exports.LINE_SCALE_MODE.HORIZONTAL:
                    intVal = 2;
                    break;
                case exports.LINE_SCALE_MODE.VERTICAL:
                    intVal = 3;
                    break;
            }
            this.shader.uniforms.scaleMode = intVal;
        }
        get scaleMode() {
            return this._scaleMode;
        }
        clear() {
            this.geometry.reset();
        }
        _renderDefault(renderer) {
            const geometry = this.geometry;
            if (geometry.points.length < 4) {
                return;
            }
            const useLegacy = !renderer.geometry.hasInstance;
            if (useLegacy) {
                geometry.initLegacy(renderer.context.supports.uint32Indices);
            }
            geometry.updateBuffer();
            if (geometry.instanceCount === 0) {
                return;
            }
            const rt = renderer.renderTexture.current;
            const multisample = rt ? rt.framebuffer.multisample > 1 : renderer.options.antialias;
            const resolution = this.shader.uniforms.resolution = (rt ? rt.baseTexture.resolution : renderer.resolution);
            this.shader.uniforms.expand = (multisample ? 2 : 1) / resolution;
            if (useLegacy) {
                this.geometry = geometry.legacyGeom;
                super._renderDefault(renderer);
                this.geometry = geometry;
                return;
            }
            super._renderDefault(renderer);
        }
        _renderCanvas(renderer) {
            const { points, stridePoints, capStyle, joinStyle } = this.geometry;
            const { context } = renderer;
            const len = points.length;
            if (len < 2) {
                return;
            }
            const wt = this.transform.worldTransform;
            renderer.setContextTransform(wt);
            const scale = Math.sqrt(wt.a * wt.a + wt.b * wt.b);
            context.lineWidth = this.shader.uniforms.styleLine[0] + this.shader.uniforms.styleLine[1] / scale;
            context.strokeStyle = utils.hex2string(this.tint);
            context.globalAlpha = this.worldAlpha;
            context.lineCap = capStyle;
            context.lineJoin = joinStyle;
            context.beginPath();
            context.moveTo(points[0], points[1]);
            for (let i = 2; i < points.length; i += stridePoints) {
                context.lineTo(points[i], points[i + 1]);
            }
            context.stroke();
            context.beginPath();
            context.globalAlpha = 1.0;
        }
    }

    const gradVert = `
attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform vec2 rangeY;

varying float vOrdinate;

void main(void)
{
vec2 pos = (translationMatrix * vec3(aVertexPosition, 1.0)).xy;
if (pos.y > rangeY.y) {
    pos.y = rangeY.y;
}
gl_Position = vec4((projectionMatrix * vec3(pos, 1.0)).xy, 0.0, 1.0);
vOrdinate = pos.y;
}`;
    const gradFrag = `
varying float vOrdinate;

uniform vec4 colorTop;
uniform vec4 colorBottom;
uniform vec4 uColor;
uniform vec2 rangeY2;

void main(void)
{
vec4 color = colorTop;
if (vOrdinate > rangeY2.x) {
    if (vOrdinate >= rangeY2.y) {
        color = colorBottom;
    } else {
        color = colorTop + (colorBottom - colorTop) * (vOrdinate - rangeY2.x) / (rangeY2.y - rangeY2.x);
    }
}

color.rgb *= color.a;
gl_FragColor = color * uColor;
}
`;
    class PlotGradientShader extends mesh.MeshMaterial {
        constructor() {
            const rangeY = new Float32Array(2);
            super(core.Texture.WHITE, {
                uniforms: {
                    resolution: 1,
                    colorTop: new Float32Array([1, 1, 1, 1]),
                    colorBottom: new Float32Array([1, 1, 1, 1]),
                    rangeY: rangeY,
                    rangeY2: rangeY,
                },
                program: PlotGradientShader.getProgram()
            });
        }
        static getProgram() {
            if (!PlotGradientShader._prog) {
                PlotGradientShader._prog = new core.Program(gradVert, gradFrag);
            }
            return PlotGradientShader._prog;
        }
    }
    PlotGradientShader._prog = null;
    class PlotGradientGeometry extends core.Geometry {
        constructor(_static = false) {
            super();
            this.lastLen = 0;
            this.lastPointNum = 0;
            this.lastPointData = 0;
            this.points = [];
            this._floatView = null;
            this._buffer = null;
            this.stridePoints = 2;
            this.strideFloats = 2 * 6;
            this.strideBytes = 8 * 6;
            this.initGeom(_static);
            this.reset();
        }
        initGeom(_static) {
            this._buffer = new core.Buffer(new Float32Array(0), _static, false);
            this.addAttribute('aVertexPosition', this._buffer, 2, false, constants.TYPES.FLOAT);
        }
        moveTo(x, y) {
            const { points } = this;
            points.push(x);
            points.push(y);
        }
        lineTo(x, y) {
            const { points } = this;
            points.push(x);
            points.push(y);
        }
        invalidate(pointNum = 0) {
            this.lastPointNum = Math.min(pointNum, this.lastPointNum);
        }
        reset() {
            if (this.lastLen > 0) {
                this.clearBufferData();
            }
            this.lastLen = 0;
            this.lastPointData = 0;
            this.points.length = 0;
        }
        clearBufferData() {
            const { points, strideFloats, stridePoints } = this;
            this.lastPointNum = 0;
            this.lastPointData = 0;
            const arrayLen = Math.max(0, points.length / stridePoints - 1);
            this._floatView = new Float32Array(strideFloats * arrayLen);
            this._buffer.update(this._floatView);
            this.lastLen = points.length;
        }
        updateBuffer() {
            const { points, stridePoints, strideFloats } = this;
            if (this.lastLen > points.length) {
                this.lastLen = -1;
            }
            if (this.lastLen < points.length
                || this.lastPointNum < this.lastLen) {
                this.clearBufferData();
            }
            if (this.lastPointNum == this.lastLen) {
                return;
            }
            const { _floatView } = this;
            this.lastPointData = Math.min(this.lastPointData, this.lastPointNum);
            let j = Math.round(this.lastPointNum * strideFloats / stridePoints);
            for (let i = this.lastPointNum; i < points.length - stridePoints; i += stridePoints) {
                const next = i + stridePoints;
                const x = points[i], y = points[i + 1], x2 = points[next], y2 = points[next + 1];
                const bottomLine = 10000.0;
                _floatView[j++] = x;
                _floatView[j++] = y;
                _floatView[j++] = x2;
                _floatView[j++] = y2;
                _floatView[j++] = x2;
                _floatView[j++] = bottomLine;
                _floatView[j++] = x;
                _floatView[j++] = y;
                _floatView[j++] = x2;
                _floatView[j++] = bottomLine;
                _floatView[j++] = x;
                _floatView[j++] = bottomLine;
            }
            this._buffer.update();
            this.lastPointNum = this.lastLen;
            this.lastPointData = this.lastLen;
        }
    }
    class PlotGradient extends mesh.Mesh {
        constructor() {
            super(new PlotGradientGeometry(), new PlotGradientShader());
            this.masterPlot = null;
            this.plotUpdateId = -1;
        }
        get coordTop() {
            return this.shader.uniforms.rangeY[0];
        }
        set coordTop(value) {
            this.shader.uniforms.rangeY[0] = value;
        }
        get coordBottom() {
            return this.shader.uniforms.rangeY[1];
        }
        set coordBottom(value) {
            this.shader.uniforms.rangeY[1] = value;
        }
        get alphaTop() {
            return this.shader.uniforms.colorTop[3];
        }
        set alphaTop(value) {
            this.shader.uniforms.colorTop[3] = value;
        }
        get alphaBottom() {
            return this.shader.uniforms.colorBottom[3];
        }
        set alphaBottom(value) {
            this.shader.uniforms.colorBottom[3] = value;
        }
        get colorBottom() {
            return utils.rgb2hex(this.shader.uniforms.colorBottom);
        }
        set colorBottom(value) {
            utils.hex2rgb(value, this.shader.uniforms.colorBottom);
        }
        get colorTop() {
            return utils.rgb2hex(this.shader.uniforms.colorTop);
        }
        set colorTop(value) {
            utils.hex2rgb(value, this.shader.uniforms.colorTop);
        }
        clear() {
            if (!this.masterPlot) {
                this.geometry.reset();
            }
        }
        moveTo(x, y) {
            this.lineTo(x, y);
        }
        lineTo(x, y) {
            if (!this.masterPlot) {
                this.geometry.lineTo(x, y);
            }
        }
        _render(renderer) {
            const geom = this.geometry;
            if (this.masterPlot) {
                const plotGeom = this.masterPlot.geometry;
                if (this.plotUpdateId !== plotGeom.updateId) {
                    this.plotUpdateId = plotGeom.updateId;
                    geom.points = plotGeom.points;
                    geom.invalidate();
                }
            }
            geom.updateBuffer();
            this._renderDefault(renderer);
        }
        _renderCanvas(renderer) {
            const geom = this.geometry;
        }
    }

    exports.Bars = Bars;
    exports.BarsGeometry = BarsGeometry;
    exports.BarsShader = BarsShader;
    exports.Plot = Plot;
    exports.PlotGeometry = PlotGeometry;
    exports.PlotGradient = PlotGradient;
    exports.PlotGradientGeometry = PlotGradientGeometry;
    exports.PlotGradientShader = PlotGradientShader;
    exports.PlotShader = PlotShader;
    exports.multIndex = multIndex;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
if (typeof _pixi_candles !== 'undefined') { Object.assign(this.PIXI.candles, _pixi_candles); }
//# sourceMappingURL=pixi-candles.umd.js.map
