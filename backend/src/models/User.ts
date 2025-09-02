import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Event } from "./Event";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  google_id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  access_token: string;

  @Column({ type: "text", nullable: true })
  refresh_token: string;

  @Column({ type: "timestamp", nullable: true })
  token_expiry: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Event, (event) => event.user)
  events: Event[];
}
