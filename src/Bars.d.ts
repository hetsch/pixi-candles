import { Buffer, Geometry, Program, Renderer } from '@pixi/core';
import { CanvasRenderer } from '@pixi/canvas-renderer';
import { Mesh, MeshMaterial } from '@pixi/mesh';
export declare class BarsShader extends MeshMaterial {
    static _prog: Program;
    static getProgram(): Program;
    constructor();
}
export declare class BarsGeometry extends Geometry {
    constructor(_static?: boolean);
    lastLen: number;
    lastPointNum: number;
    lastPointData: number;
    points: Array<number>;
    _floatView: Float32Array;
    _u32View: Uint32Array;
    _buffer: Buffer;
    _quad: Buffer;
    _indexBuffer: Buffer;
    initGeom(_static: boolean): void;
    stridePoints: number;
    strideFloats: number;
    strideBytes: number;
    addRect(x: number, y: number, w: number, h: number, color: number): void;
    invalidate(pointNum?: number): void;
    reset(): void;
    clearBufferData(): void;
    updateBuffer(): void;
    legacyGeom: Geometry;
    legacyBuffer: Buffer;
    initLegacy(): void;
    updateLegacy(): void;
}
export declare class Bars extends Mesh {
    constructor();
    addRect(x: number, y: number, w: number, h: number, color: number): void;
    clear(): void;
    _renderDefault(renderer: Renderer): void;
    _renderCanvas(renderer: CanvasRenderer): void;
}
