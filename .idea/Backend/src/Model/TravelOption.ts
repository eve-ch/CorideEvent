import {Direction} from '../Enums/Direction';

export class TravelOption{
    private id: string;
    private placeName: string;
    private departureTime: Date;
    private direction: Direction;

    constructor(id: string,
                placeName: string,
                departureTime: Date,
                direction: Direction) {
        this.id = id;
        this.placeName = placeName;
        this.departureTime = departureTime;
        this.direction = direction;
    }

    public isSameOption(other: TravelOption): boolean{
        return this.id == other.id;
    }

    // Get
    public getId(): string {
        return this.id;
    }

    public getPlaceName(): string {
        return this.placeName;
    }

    public getDepartureTime(): Date {
        return this.departureTime;
    }

    public getDirection(): Direction {
        return this.direction;
    }
}