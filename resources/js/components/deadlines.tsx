export function Deadlines({
    deadlines = [{ title: 'Deadline', description: 'lorem' }] }:
    { deadlines?: { title: string; description: string }[] }
) {
    return (
        <div className="p-4">
            <h2 className="font-bold text-2xl">Deadlines</h2>
            <div className="mt-2">
                {deadlines.map((deadline, index) => (
                    <div className="border rounded-md p-2 flex">
                        <div className="flex flex-col">
                            <h3 className="font-bold">{deadline.title}</h3>
                            <p className="text-muted-foreground">{deadline.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}