import styles from './PricingSection.module.css';
import { siteConfig } from '@/config/siteConfig';

export default function PricingSection({ config }) {
    const pricing = config?.pricing || siteConfig.pricing;

    return (
        <section id="pricing" className={styles.section}>
            <div className="container">
                <h2 className="section-title">Transparent Pricing</h2>
                <p className="section-subtitle">Simple pricing structure for all your needs.</p>

                <div className={styles.grid}>
                    {pricing.map((category, index) => (
                        <div key={index} className={styles.categoryCard}>
                            <h3 className={styles.categoryTitle}>{category.category}</h3>
                            <ul className={styles.list}>
                                {category.details.map((item, idx) => (
                                    <li key={idx} className={styles.listItem}>
                                        <span className={styles.label}>{item.label}</span>
                                        <span className={styles.price}>{item.price}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
