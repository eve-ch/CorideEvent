export class Organizer{
    private id: string;
    private name: string;
    private email: string;
    private passwordHash: string;

      // Konstruktor
    constructor(id: string, name: string, email: string, passwordHash: string) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public createEvent(
        name: string,
        description: string,
        eventLocation:string,
        startsAt: Date,
        applicationDeadline: Date
    ): Event{
        const eventId = crypto.randomUUID();
        const shareToken = crypto.randomUUID();
        const newEvent :Event = new Event(eventId,
            name,
            description,
            eventLocation,
            startsAt,
            applicationDeadline,
            shareToken);

        return newEvent;

    }

    public updateEvent(event:Event): void{
        console.log(`Uppdaterar event: ${event.getName()}`); //Skriver ut
    }


}