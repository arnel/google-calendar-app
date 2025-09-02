import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { User } from "./User";

@Entity("events")
@Index(["user_id", "google_event_id"], { unique: true })
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ nullable: true })
  google_event_id: string;

  @Column()
  title: string;

  @Column({ type: "timestamp" })
  start_time: Date;

  @Column({ type: "timestamp" })
  end_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.events, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
