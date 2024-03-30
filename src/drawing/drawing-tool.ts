import {
	IChartApi,
	ISeriesApi,
	MouseEventParams,
	SeriesType,
} from 'lightweight-charts';
import { Drawing } from './drawing';


export class DrawingTool {
	private _chart: IChartApi;
	private _series: ISeriesApi<SeriesType>;
	private _finishDrawingCallback: Function | null = null;

	private _drawings: Drawing[] = [];
	private _activeDrawing: Drawing | null = null;
	private _isDrawing: boolean = false;
	private _drawingType: (new (...args: any[]) => Drawing) | null = null;

	constructor(chart: IChartApi, series: ISeriesApi<SeriesType>, finishDrawingCallback: Function | null = null) {
		this._chart = chart;
		this._series = series;
		this._finishDrawingCallback = finishDrawingCallback;

		this._chart.subscribeClick(this._clickHandler);
		this._chart.subscribeCrosshairMove(this._moveHandler);
	}

	private _clickHandler = (param: MouseEventParams) => this._onClick(param);
	private _moveHandler = (param: MouseEventParams) => this._onMouseMove(param);

	beginDrawing(DrawingType: new (...args: any[]) => Drawing) {
		this._drawingType = DrawingType;
		this._isDrawing = true;
	}

	stopDrawing() {
		this._isDrawing = false;
		this._activeDrawing = null;
	}

	get drawings() {
		return this._drawings;
	}

	addNewDrawing(drawing: Drawing) {
		this._series.attachPrimitive(drawing);
		this._drawings.push(drawing);
	}

	delete(d: Drawing | null) {
		if (d == null) return;
		const idx = this._drawings.indexOf(d);
		if (idx == -1) return;
		this._drawings.splice(idx, 1)
		d.detach();
	}

	clearDrawings() {
		for (const d of this._drawings) d.detach();
		this._drawings = [];
	}

	private _onClick(param: MouseEventParams) {
		if (!this._isDrawing) return;

		const point = Drawing._eventToPoint(param, this._series);
		if (!point) return;

		if (this._activeDrawing == null) {
			if (this._drawingType == null) return;

			this._activeDrawing = new this._drawingType(point, point);
			this._series.attachPrimitive(this._activeDrawing);
		}
		else {
			this._drawings.push(this._activeDrawing);
			this.stopDrawing();

			if (!this._finishDrawingCallback) return;
			this._finishDrawingCallback();
		}
	}

	private _onMouseMove(param: MouseEventParams) {
		if (!param) return;

		for (const t of this._drawings) t._handleHoverInteraction(param);

		if (!this._isDrawing || !this._activeDrawing) return;

		const point = Drawing._eventToPoint(param, this._series);
		if (!point) return;
		this._activeDrawing.updatePoints(null, point);
		// this._activeDrawing.setSecondPoint(point);
	}
}