import {MatchingStatus} from '../Enums/MatchingStatus';
import {TravelOption} from './TravelOption';

export class Event{
    private id : string;
    private name: string;
    private description: string;
    private eventLocation: string;
    private startsAt: Date;
    private applicationDeadline: Date;
    private shareToken: string;
    private matchingStatus: MatchingStatus;
    private travelOptions: TravelOption[] = [];

    constructor(id: string,
                name: string,
                description: string,
                eventLocation: string,
                startsAt: Date,
                applicationDeadline: Date,
                shareToken: string,
                matchingStatus: MatchingStatus = MatchingStatus.NOT_STARTED
    ){
        this.id = id;
        this.name = name;
        this.description = description;
        this.eventLocation = eventLocation;
        this.startsAt = startsAt;
        this.applicationDeadline = applicationDeadline;
        this.shareToken = shareToken;
        this.matchingStatus = matchingStatus;
    }

    public isRegistrationOpen(now: Date): boolean{
        return now <= this.applicationDeadline;
    }

    public addTravelOption(option: TravelOption): void{
        this.travelOptions.push(option);
    }

    public startMatching(): void{
        this.matchingStatus = MatchingStatus.COMPLETED;
    }

    //Get så att Organizer kan läsa eventets namn i updateEvent
    public getName(): string {
        return this.name;
    }

    public getId(): string {
        return this.id;
    }

    public getTravelOptions(): TravelOption[] {
        return this.travelOptions;
    }
}