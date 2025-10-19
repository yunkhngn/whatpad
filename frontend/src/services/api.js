const domain = 'http://localhost:4000'

export async function getStories(id) {
    const response = await fetch(`${domain}/stories`)
    const responseData = await response.json()
    return responseData?.data
}

export async function getStoryById(id) {
    const response = await fetch(`${domain}/stories/${id}`)
    const responseData = await response.json()
    return responseData?.data
}

export async function getChapterById(chapterId) {
    const response = await fetch(`${domain}/chapters/${chapterId}`)
    const responseData = await response.json()
    return responseData?.data
}

export async function getUserById(id) {
    const response = await fetch(`${domain}/users/${id}`);
    const responseData = await response.json()
    return responseData?.data
}