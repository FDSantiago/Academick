import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface Announcement {
    id: number;
    title: string;
    content: string;
    created_at: string;
    author?: {
        name: string;
    };
    is_read?: boolean;
}

interface AnnouncementFeedProps {
    announcements: Announcement[];
    maxHeight?: string;
}

export function AnnouncementFeed({ announcements, maxHeight = "400px" }: AnnouncementFeedProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Announcements
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea style={{ height: maxHeight }}>
                    {announcements.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No announcements yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {announcements.map((announcement) => (
                                <div
                                    key={announcement.id}
                                    className={`p-4 hover:bg-muted/50 transition-colors ${
                                        !announcement.is_read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-medium text-sm line-clamp-1">
                                                    {announcement.title}
                                                </h4>
                                                {!announcement.is_read && (
                                                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                                        New
                                                    </Badge>
                                                )}
                                            </div>

                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                {announcement.content}
                                            </p>

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                {announcement.author && (
                                                    <div className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        <span>{announcement.author.name}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>
                                                        {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}