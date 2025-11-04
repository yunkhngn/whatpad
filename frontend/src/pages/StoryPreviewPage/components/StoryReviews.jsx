import { useState } from 'react';

import avatarPlaceholder from '../../../assests/images/avatar-placeholder.jpg'
import UserImage from "../../../components/UserImage";

export default function StoryReviews({
    styles,
    currentUser,
    reviews
}) {
    const [reviewInput, setReviewInput] = useState('')

    return <div className={styles.section}>
        <h3 className="mb-3">Reviews</h3>

        <div className={styles.userReview}>
            <UserImage
                size="sm"
                src={currentUser.userAvatar || avatarPlaceholder}
                alt={currentUser.name} />
            <input
                type="text"
                className={styles.reviewInput}
                placeholder="Add your review here"
                value={reviewInput}
                onChange={(e) => setReviewInput(e.target.value)} />
        </div>

        <ul className="list-unstyled">
            {reviews.map(review => <li key={review.id} className={styles.reviewItem}>
                <div className={styles.userInfo}>
                    <UserImage size="sm" src={review.userAvatar || avatarPlaceholder} alt={review.user} />
                    <div className={styles.userDetail}>
                        <p className={styles.userName}>{review.user}</p>
                        <p className={styles.reviewDate}>{review.createAt}</p>
                    </div>
                </div>
                <div>
                    {review.content}
                </div>
            </li>)}
        </ul>
    </div>
}