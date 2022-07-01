import { Buffer, Geometry, Program, Renderer } from '@pixi/core';
import { CanvasRenderer } from '@pixi/canvas-renderer';
import { Mesh, MeshMaterial } from '@pixi/mesh';
import { Plot } from './Plot';
export declare class PlotGradientShader extends MeshMaterial {
    static _prog: Program;
    static getProgram(): Program;
    constructor();
}
export declare class PlotGradientGeometry extends Geometry {
    constructor(_static?: boolean);
    lastLen: number;
    lastPointNum: number;
    lastPointData: number;
    points: Array<number>;
    _floatView: Float32Array;
    _buffer: Buffer;
    initGeom(_static: boolean): void;
    stridePoints: number;
    strideFloats: number;
    strideBytes: number;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    invalidate(pointNum?: number): void;
    reset(): void;
    clearBufferData(): void;
    updateBuffer(): void;
}
export declare class PlotGradient extends Mesh {
    constructor();
    get coordTop(): number;
    set coordTop(value: number);
    get coordBottom(): number;
    set coordBottom(value: number);
    get alphaTop(): number;
    set alphaTop(value: number);
    get alphaBottom(): number;
    set alphaBottom(value: number);
    get colorBottom(): number;
    set colorBottom(value: number);
    get colorTop(): number;
    set colorTop(value: number);
    masterPlot: Plot;
    plotUpdateId: number;
    clear(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    _render(renderer: Renderer): void;
    _renderCanvas(renderer: CanvasRenderer): void;
}
