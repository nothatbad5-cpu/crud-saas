import { getSubscriptionStatus } from '@/lib/subscription'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ManageSubscriptionButton from '@/components/ManageSubscriptionButton'

export default async function BillingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const subscription = await getSubscriptionStatus(user.id)
    const isSubscribed = subscription?.isValid
    const status = subscription?.status || 'none'

    return (
        <div className="bg-[#111] shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-100">Billing</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                    Manage your subscription and billing details.
                </p>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-400">Status</dt>
                        <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2 capitalize">
                            {String(status || 'none')}
                        </dd>
                    </div>
                    {isSubscribed && (
                        <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-400">Current Period End</dt>
                            <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2">
                                {subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                            </dd>
                        </div>
                    )}
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-400">Actions</dt>
                        <dd className="mt-1 text-sm text-gray-100 sm:mt-0 sm:col-span-2">
                            {isSubscribed ? (
                                <ManageSubscriptionButton />
                            ) : (
                                <Link
                                    href="/pricing"
                                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Upgrade to Pro
                                </Link>
                            )}
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    )
}
