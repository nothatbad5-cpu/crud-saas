export default function DashboardLoading() {
    return (
        <div className="animate-pulse">
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="h-64 bg-gray-100"></div>
            </div>
        </div>
    )
}
