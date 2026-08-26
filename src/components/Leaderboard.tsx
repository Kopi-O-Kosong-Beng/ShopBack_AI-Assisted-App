import { useReadyApp } from '../app/appContext'
import { levelForXp, levelTitle, rankUsers } from '../domain/xp'
import { listLeaderboard } from '../storage/userRepository'

export default function Leaderboard() {
  const { adb, user } = useReadyApp()
  const rows = rankUsers(listLeaderboard(adb.db))

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th scope="col" className="px-4 py-3 font-medium">Rank</th>
              <th scope="col" className="px-4 py-3 font-medium">Teammate</th>
              <th scope="col" className="px-4 py-3 font-medium">Department</th>
              <th scope="col" className="px-4 py-3 font-medium">Level</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">XP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isMe = row.username === user.username
              return (
                <tr
                  key={row.username}
                  className={`border-b border-slate-50 last:border-b-0 ${
                    isMe ? 'bg-brand-50/70' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-500">
                    #{row.rank}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {row.username}
                    {isMe && (
                      <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{row.department}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {levelTitle(levelForXp(row.xp))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-700">
                    {row.xp}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
        Complete tasks to earn XP, and finish on time for a bonus. Includes demo
        colleagues so the board has some competition.
      </p>
    </section>
  )
}
