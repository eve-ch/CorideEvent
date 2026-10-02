export class Organizer{
    private id: string;
    private name: string;
    private email: string;
    private passwordHash: string;

      // Konstruktor
    constructor(id: string, name: string, email: string, passwordHash: string) {
        this.id = "123";
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public createEvent(
        name: String,
        description:String,
        eventLocation:String,
        startsAt:LocalDateTime,
        applicationDeadline:LocalDateTime
    ): Event{
        const eventId = "Event 1";
        const newEvent :Event = new Event(eventId, name, description, eventLocation, startsAt, applicationDeadline, this.id);

        return newEvent;

    }

    public updateEvent(event:Event): void{
        console.log(`Uppdaterar event: ${event.name}`); //Skriver ut
    }


}