// Mock data for stories

const mockStories = [
    {
        id: "1",
        title: "The Midnight Chronicles",
        author: "Sarah Johnson",
        description:
            "A thrilling fantasy adventure about a young mage discovering her powers in a world where magic is forbidden.",
        reads: "2.5M",
        votes: "125K",
        comments: "15K",
        chapters: 45,
        content: `The moon hung low in the sky, casting an ethereal glow over the ancient forest. Elena had always known she was different, but tonight, everything would change.\n\nAs she walked through the twisted paths between the towering trees, she felt the familiar tingle in her fingertips. The magic was calling to her, stronger than ever before. She knew the risks—magic users were hunted, imprisoned, or worse. But she couldn't deny what she was anymore.\n\nA rustling in the bushes made her freeze. Her heart pounded as a figure emerged from the shadows. "I've been waiting for you," the stranger said, their voice barely above a whisper. "It's time you learned the truth about who you really are."\n\nElena's life was about to change forever, and there was no turning back now.`,
    },
    {
        id: "2",
        title: "Love in the City",
        author: "Michael Chen",
        description:
            "A heartwarming romance about two strangers who keep crossing paths in the bustling streets of New York.",
        reads: "1.8M",
        votes: "98K",
        comments: "12K",
        chapters: 32,
        content: `The coffee shop on 5th Avenue was always crowded at 8 AM, but somehow, they always ended up in line at the same time.\n\nEmma had noticed him three weeks ago—tall, dark hair, always ordering the same thing: a large black coffee and a blueberry muffin. She'd memorized his order without meaning to, the same way she'd memorized the way he smiled at the barista.\n\nToday, fate had other plans. As she reached for her usual latte, their hands touched. Time seemed to slow as their eyes met for the first time.\n\n"I'm so sorry," he said, his voice warm and genuine.\n\n"No, it's okay," Emma replied, feeling her cheeks flush. "I wasn't paying attention."\n\nWhat neither of them knew was that this simple moment would be the beginning of something extraordinary.`,
    },
    {
        id: "3",
        title: "The Last Survivor",
        author: "Alex Rivera",
        description: "In a post-apocalyptic world, one person holds the key to humanity's survival.",
        reads: "3.2M",
        votes: "156K",
        comments: "18K",
        chapters: 52,
        content: `The wasteland stretched endlessly in every direction. Once, this had been a thriving city, full of life and hope. Now, only ruins remained.\n\nKai adjusted the gas mask and checked the radiation meter. Still safe, for now. The bunker was three miles east, if the old maps were correct. If they were wrong, well, it wouldn't matter much longer anyway.\n\nA sound echoed across the empty streets—footsteps. Kai wasn't alone. In this world, that was rarely a good thing. Hand moving to the weapon at their side, Kai prepared for whatever came next.\n\nSurvival was all that mattered now. But sometimes, Kai wondered if surviving was enough, or if there had to be something more to fight for.`,
    },
    {
        id: "4",
        title: "High School Diaries",
        author: "Jessica Park",
        description: "Navigate the ups and downs of teenage life, friendship, and first love in this coming-of-age story.",
        reads: "1.5M",
        votes: "89K",
        comments: "10K",
        chapters: 28,
        content: `First day of senior year. Maya stood in front of her locker, trying to remember the combination she'd used for the past three years.\n\n"Need help?" a familiar voice asked. She turned to see Jake, her best friend since kindergarten, grinning at her.\n\n"I've got it," she insisted, even as she failed the combination for the third time.\n\nJake laughed and gently moved her aside. "It's 24-15-8. Same as always. You really need to write these things down."\n\nAs the locker clicked open, Maya realized something had changed over the summer. The way Jake smiled at her, the way her heart skipped when he was near—everything felt different now.\n\nThis was going to be an interesting year.`,
    },
    {
        id: "5",
        title: "Mystery at Blackwood Manor",
        author: "Robert Holmes",
        description: "A detective must solve a decades-old mystery hidden within the walls of a haunted mansion.",
        reads: "2.1M",
        votes: "112K",
        comments: "14K",
        chapters: 38,
        content: `The invitation had been unexpected. Detective Claire Morrison hadn't heard from the Blackwood family in twenty years, not since the night Lady Blackwood disappeared without a trace.\n\nNow, standing before the imposing manor, Claire felt the same chill she'd experienced all those years ago. The house seemed to watch her, its dark windows like eyes following her every move.\n\nThe butler opened the door before she could knock. "Detective Morrison. We've been expecting you. Please, come in. The family is waiting in the library."\n\nAs Claire stepped inside, she couldn't shake the feeling that she was walking into a trap. But she'd come too far to turn back now. The truth about what happened that night was somewhere in this house, and she was determined to find it.`,
    },
    {
        id: "6",
        title: "Starship Horizon",
        author: "David Kim",
        description: "Humanity's first interstellar voyage faces unexpected challenges light-years from home.",
        reads: "1.9M",
        votes: "95K",
        comments: "11K",
        chapters: 41,
        content: `Captain Torres stared at the viewscreen, watching the stars streak past as the Horizon jumped to faster-than-light speed. They were three months into a five-year mission to establish humanity's first colony beyond the solar system.\n\n"Captain, we're detecting an anomaly," Lieutenant Park reported from the science station. "There's something out there. Something big."\n\nTorres leaned forward. "On screen."\n\nWhat appeared before them defied explanation. A structure, massive and ancient, floating in the void between stars. It wasn't on any of their charts. It shouldn't exist.\n\n"Scan it," Torres ordered. "And wake the rest of the crew. I have a feeling our mission just got a lot more complicated."\n\nIn the depths of space, they had found something. The question was: what would it mean for humanity's future?`,
    },
]

// API functions (placeholder implementations)
export function getStories() {
    // In a real app, this would fetch from an API
    return mockStories
}

export function getStoryById(id) {
    // In a real app, this would fetch from an API
    return mockStories.find((story) => story.id === id)
}

export function searchStories(query) {
    // In a real app, this would call a search API
    return mockStories.filter(
        (story) =>
            story.title.toLowerCase().includes(query.toLowerCase()) ||
            story.author.toLowerCase().includes(query.toLowerCase()) ||
            story.description.toLowerCase().includes(query.toLowerCase()),
    )
}

export function getStoriesByGenre(genre) {
    // In a real app, this would filter by genre from API
    return mockStories.filter((story) => story.genre.toLowerCase() === genre.toLowerCase())
}
