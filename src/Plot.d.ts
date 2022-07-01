import { Buffer, Geometry, Program, Renderer } from '@pixi/core';
import { CanvasRenderer } from '@pixi/canvas-renderer';
import { Mesh, MeshMaterial } from '@pixi/mesh';
import { LINE_JOIN, LINE_CAP } from '@pixi/graphics';
export declare enum JOINT_TYPE {
    NONE = 0,
    FILL = 1,
    JOINT_BEVEL = 4,
    JOINT_MITER = 8,
    JOINT_ROUND = 12,
    JOINT_CAP_BUTT = 16,
    JOINT_CAP_SQUARE = 18,
    JOINT_CAP_ROUND = 20,
    FILL_EXPAND = 24,
    CAP_BUTT = 32,
    CAP_SQUARE = 64,
    CAP_ROUND = 96,
    CAP_BUTT2 = 128
}
export declare enum LINE_SCALE_MODE {
    NONE = "none",
    NORMAL = "normal",
    HORIZONTAL = "horizontal",
    VERTICAL = "vertical"
}
export declare class PlotShader extends MeshMaterial {
    static _prog: Program;
    static getProgram(): Program;
    constructor();
}
export declare function multIndex(indices: Uint32Array, vertCount: number, instanceCount: number, support32?: boolean): Uint16Array | Uint32Array;
export declare class PlotGeometry extends Geometry {
    constructor(_static?: boolean);
    joinStyle: LINE_JOIN;
    capStyle: LINE_CAP;
    lastLen: number;
    lastPointNum: number;
    lastPointData: number;
    updateId: number;
    points: Array<number>;
    _floatView: Float32Array;
    _u32View: Uint32Array;
    _buffer: Buffer;
    _quad: Buffer;
    _indexBuffer: Buffer;
    _vertexNums: Buffer;
    support32: boolean;
    initGeom(_static: boolean): void;
    stridePoints: number;
    strideFloats: number;
    strideBytes: number;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    lineBy(dx: number, dy: number): void;
    invalidate(pointNum?: number): void;
    reset(): void;
    clearBufferData(): void;
    updateBuffer(): void;
    legacyGeom: Geometry;
    legacyBuffer: Buffer;
    initLegacy(support32: boolean): void;
    updateLegacy(): void;
    capType(): number;
    goodJointType(): number;
    jointType(): number;
}
export interface PlotOptions {
    lineWidth?: number;
    nativeLineWidth?: number;
    joinStyle?: LINE_JOIN;
    capStyle?: LINE_CAP;
}
export interface ILineStyleOptions {
    color?: number;
    alpha?: number;
    width?: number;
    alignment?: number;
    scaleMode?: LINE_SCALE_MODE;
    cap?: LINE_CAP;
    join?: LINE_JOIN;
    miterLimit?: number;
}
export declare class Plot extends Mesh {
    constructor(options: PlotOptions);
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    lineBy(x: number, y: number): void;
    lineStyle(width?: number, nativeWidth?: number, joinStyle?: LINE_JOIN, capStyle?: LINE_CAP): void;
    gLineStyle(obj: ILineStyleOptions): void;
    set scaleMode(value: LINE_SCALE_MODE);
    get scaleMode(): LINE_SCALE_MODE;
    private _scaleMode;
    clear(): void;
    _renderDefault(renderer: Renderer): void;
    _renderCanvas(renderer: CanvasRenderer): void;
}
